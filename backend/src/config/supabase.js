/**
 * =========================================================================
 * ⚡ SUPABASE CLIENT & ORM PROXY (ตัวเชื่อมต่อและตัวแปลงคำสั่งฐานข้อมูล)
 * =========================================================================
 * ทำหน้าที่เป็น Proxy/Wrapper แปลงโครงสร้างคำสั่งระหว่าง PascalCase
 * และ Supabase DB Schema (lowercase snake_case) ให้ยืดหยุ่นและเสถียร
 *
 * 🎓 พัฒนาขึ้นสำหรับ: มหาวิทยาลัยหอการค้าไทย (UTCC)
 * =========================================================================
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const claimsDb = require("./claimsDb");

// Fix for Node.js < 22 lacking global WebSocket support required by Supabase Realtime
if (typeof global.WebSocket === "undefined") {
  global.WebSocket = require("ws");
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.",
  );
}

const client = createClient(supabaseUrl, supabaseKey);

// Status Mappings between PascalCase enums and the active database found_item_statuses (int4)
const foundStatusToId = {
  FOUND: 1,
  STORED: 2,
  MATCHED: 3,
  CLAIMED: 4,
  RETURNED: 5,
  EXPIRED: 6,
};

const idToFoundStatus = {
  1: "FOUND",
  2: "STORED",
  3: "MATCHED",
  4: "CLAIMED",
  5: "RETURNED",
  6: "EXPIRED",
};

const lostStatusToId = {
  LOST: 1,
  MATCHED: 3,
  CLOSED: 5,
};

const idToLostStatus = {
  1: "LOST",
  3: "MATCHED",
  5: "CLOSED",
};

// Static monthly lockers to map the UI lockers to the database locker codes
const staticLockers = Array.from({ length: 12 }, (_, i) => {
  const id = `L${String(i + 1).padStart(2, "0")}`;
  const name = `ล็อกเกอร์ ที่ - ${i + 1}`;
  return {
    locker_id: id,
    locker_code: name,
    status: "AVAILABLE",
    location_id: 1,
    description: "ตู้เก็บของมหาวิทยาลัย",
  };
});

function translateSelectString(selectStr) {
  if (typeof selectStr !== "string") return selectStr;
  let s = selectStr.replace(/\bCategory\b/g, "categories");
  s = s.replace(/\bLocation\b/g, "locations");
  s = s.replace(/\bPerson!/g, "persons!");
  s = s.replace(/,?\s*\bLocker\([^)]*\)/g, "");
  s = s.replace(/,\s*,/g, ",");
  s = s.replace(/^\s*,|,?\s*$/g, "");
  return s;
}

function mapResultRow(row, expectedTable, depth = 0) {
  if (depth > 10) {
    console.error("Too deep recursion in mapResultRow! Row:", row);
    throw new Error("Stack overflow prevented");
  }
  if (!row || typeof row !== "object") return row;
  const mapped = { ...row };

  if (expectedTable === "FoundItem") {
    if (mapped.item_id !== undefined) {
      mapped.found_item_id = mapped.item_id;
      delete mapped.item_id;
    }
    if (mapped.status_id !== undefined) {
      mapped.status = idToFoundStatus[mapped.status_id] || "FOUND";
      delete mapped.status_id;
    }
    if (mapped.categories !== undefined) {
      mapped.Category = mapped.categories;
      delete mapped.categories;
    }
    if (mapped.locations !== undefined) {
      mapped.Location = mapped.locations;
      delete mapped.locations;
    }
    if (mapped.persons !== undefined) {
      mapped.Person = mapped.persons;
      delete mapped.persons;
    }
    if (mapped.locker_id !== undefined) {
      mapped.Locker = {
        locker_id: mapped.locker_id,
        locker_code: mapped.locker_id,
      };
    }
  } else if (expectedTable === "LostItem") {
    if (mapped.status_id !== undefined) {
      mapped.status = idToLostStatus[mapped.status_id] || "LOST";
      delete mapped.status_id;
    }
    if (mapped.categories !== undefined) {
      mapped.Category = mapped.categories;
      delete mapped.categories;
    }
    if (mapped.locations !== undefined) {
      mapped.Location = mapped.locations;
      delete mapped.locations;
    }
    if (mapped.persons !== undefined) {
      mapped.Person = mapped.persons;
      delete mapped.persons;
    }
  }

  for (const key of Object.keys(mapped)) {
    if (Array.isArray(mapped[key])) {
      mapped[key] = mapped[key].map((r) => mapResultRow(r, null, depth + 1));
    } else if (mapped[key] && typeof mapped[key] === "object") {
      if (!(mapped[key] instanceof Date)) {
        mapped[key] = mapResultRow(mapped[key], null, depth + 1);
      }
    }
  }
  return mapped;
}

const tableMap = {
  User: "users",
  Person: "persons",
  Category: "categories",
  Location: "locations",
  FoundItem: "items",
  LostItem: "lost_items",
  AuditLog: "audit_logs",
};

function translateCol(table, col) {
  if (table === "FoundItem") {
    if (col === "found_item_id") return "item_id";
    if (col === "status") return "status_id";
  }
  if (table === "LostItem") {
    if (col === "status") return "status_id";
  }
  return col;
}

function translateVal(table, col, val) {
  if (table === "FoundItem" && col === "status") {
    if (Array.isArray(val)) {
      return val.map((v) => foundStatusToId[v] || 1);
    }
    return foundStatusToId[val] || 1;
  }
  if (table === "LostItem" && col === "status") {
    if (Array.isArray(val)) {
      return val.map((v) => lostStatusToId[v] || 1);
    }
    return lostStatusToId[val] || 1;
  }
  return val;
}

function mapInputData(table, data) {
  if (!data || typeof data !== "object") return data;
  const mapped = { ...data };

  if (table === "FoundItem") {
    if (mapped.found_item_id !== undefined) {
      mapped.item_id = mapped.found_item_id;
      delete mapped.found_item_id;
    }
    if (mapped.status !== undefined) {
      mapped.status_id = foundStatusToId[mapped.status] || 1;
      delete mapped.status;
    }
    if (mapped.floor !== undefined) {
      if (mapped.floor) {
        mapped.description =
          `[ชั้น ${mapped.floor}] ${mapped.description || ""}`.trim();
      }
      delete mapped.floor;
    }
  } else if (table === "LostItem") {
    if (mapped.status !== undefined) {
      mapped.status_id = lostStatusToId[mapped.status] || 1;
      delete mapped.status;
    }
    if (mapped.floor !== undefined) {
      if (mapped.floor) {
        mapped.description =
          `[ชั้น ${mapped.floor}] ${mapped.description || ""}`.trim();
      }
      delete mapped.floor;
    }
  }
  return mapped;
}

class WrappedQuery {
  constructor(table) {
    this.table = table;
    this.realTable = tableMap[table] || table;
    this.chain = [];
    this.selectColumns = "*";
    this.selectOpts = null;
    this.insertData = null;
    this.updateData = null;
    this.isDelete = false;
  }

  select(cols = "*", opts = null) {
    this.selectColumns = translateSelectString(cols);
    this.selectOpts = opts;
    return this;
  }

  insert(data) {
    this.insertData = data;
    return this;
  }

  update(data) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  eq(col, val) {
    this.chain.push({ type: "eq", col, val });
    return this;
  }

  in(col, vals) {
    this.chain.push({ type: "in", col, vals });
    return this;
  }

  ilike(col, val) {
    this.chain.push({ type: "ilike", col, val });
    return this;
  }
  or(filters, opts = null) {
    this.chain.push({ type: "or", filters, opts });
    return this;
  }

  order(col, opts) {
    this.chain.push({ type: "order", col, opts });
    return this;
  }

  limit(n) {
    this.chain.push({ type: "limit", n });
    return this;
  }

  range(from, to) {
    this.chain.push({ type: "range", from, to });
    return this;
  }

  maybeSingle() {
    this.chain.push({ type: "maybeSingle" });
    return this;
  }

  single() {
    this.chain.push({ type: "single" });
    return this;
  }

  async execute() {
    try {
      // 1. Handle Locker Mock
      if (this.table === "Locker") {
        if (this.insertData) {
          return { data: this.insertData, error: null };
        }
        if (this.updateData) {
          return { data: null, error: null };
        }
        let data = [...staticLockers];
        for (const op of this.chain) {
          if (op.type === "eq") {
            data = data.filter((item) => item[op.col] === op.val);
          }
        }
        if (
          this.chain.some(
            (op) => op.type === "single" || op.type === "maybeSingle",
          )
        ) {
          return { data: data[0] || null, error: null };
        }
        return { data, error: null };
      }

      // 2. Handle ItemPhoto Mock
      if (this.table === "ItemPhoto") {
        if (this.insertData) {
          const rows = Array.isArray(this.insertData)
            ? this.insertData
            : [this.insertData];
          for (const row of rows) {
            const itemType = row.item_type;
            const itemId = row.item_id;
            const fileUrl = row.file_url;
            if (itemType === "FOUND") {
              await client
                .from("items")
                .update({ image_url: fileUrl })
                .eq("item_id", itemId);
            } else {
              await client
                .from("lost_items")
                .update({ image_url: fileUrl })
                .eq("lost_item_id", itemId);
            }
          }
          return { data: this.insertData, error: null };
        }
        if (this.isDelete) {
          let photoId = null;
          for (const op of this.chain) {
            if (op.col === "photo_id") photoId = op.val;
          }
          if (photoId) {
            await client
              .from("items")
              .update({ image_url: null })
              .eq("item_id", photoId);
            await client
              .from("lost_items")
              .update({ image_url: null })
              .eq("lost_item_id", photoId);
          }
          return { data: null, error: null };
        }

        let itemIds = null;
        let itemType = "FOUND";
        for (const op of this.chain) {
          if (op.col === "item_id") {
            itemIds = Array.isArray(op.val) ? op.val : [op.val];
          } else if (op.col === "item_type") {
            itemType = op.val;
          }
        }
        if (itemType === "FOUND") {
          let query = client.from("items").select("item_id, image_url");
          if (itemIds) query = query.in("item_id", itemIds);
          const { data, error } = await query;
          if (error) return { data: null, error };
          const photos = (data || [])
            .filter((item) => item.image_url)
            .map((item) => ({
              photo_id: item.item_id,
              item_type: "FOUND",
              item_id: item.item_id,
              file_url: item.image_url,
              is_primary: true,
            }));
          return { data: photos, error: null };
        } else {
          let query = client
            .from("lost_items")
            .select("lost_item_id, image_url");
          if (itemIds) query = query.in("lost_item_id", itemIds);
          const { data, error } = await query;
          if (error) return { data: null, error };
          const photos = (data || [])
            .filter((item) => item.image_url)
            .map((item) => ({
              photo_id: item.lost_item_id,
              item_type: "LOST",
              item_id: item.lost_item_id,
              file_url: item.image_url,
              is_primary: true,
            }));
          return { data: photos, error: null };
        }
      }

      // 3. Handle Claim Mock
      if (this.table === "Claim") {
        if (this.insertData) {
          const row = this.insertData;
          const found_item_id = row.found_item_id;
          const claimer_id = row.claimer_id;
          const claim_date = row.claim_date || new Date().toISOString();
          const status = row.status || "CLAIMED";
          const remark = row.remark;
          const status_id = foundStatusToId[status] || 4;
          const { data: res, error } = await client
            .from("items")
            .update({ claimer_id, claim_date, remark, status_id })
            .eq("item_id", found_item_id)
            .select();
          return { data: res, error };
        }
        if (this.updateData) {
          let claimId = null;
          for (const op of this.chain) {
            if (op.col === "claim_id") claimId = op.val;
          }
          if (claimId) {
            const localClaim = claimsDb.getClaimById(claimId);
            if (localClaim) {
              const status_id = foundStatusToId[this.updateData.status] || 5;
              const { data: res, error } = await client
                .from("items")
                .update({
                  status_id,
                  claim_date:
                    this.updateData.return_date || new Date().toISOString(),
                })
                .eq("item_id", localClaim.found_item_id)
                .select();
              return { data: res, error };
            }
          }
          return { data: null, error: null };
        }
        return { data: [], error: null };
      }

      // 4. Standard Table translation
      let query;
      if (this.insertData) {
        let mappedData = Array.isArray(this.insertData)
          ? this.insertData.map((d) => mapInputData(this.table, d))
          : mapInputData(this.table, this.insertData);
        query = client.from(this.realTable).insert(mappedData);
        query = query.select(this.selectColumns || "*");
      } else if (this.updateData) {
        let mappedData = mapInputData(this.table, this.updateData);
        query = client.from(this.realTable).update(mappedData);
        query = query.select(this.selectColumns || "*");
      } else if (this.isDelete) {
        query = client.from(this.realTable).delete();
      } else {
        query = client
          .from(this.realTable)
          .select(this.selectColumns, this.selectOpts);
      }

      // Apply conditions with name/value translations
      for (const op of this.chain) {
        const translatedCol = translateCol(this.table, op.col);
        if (op.type === "eq") {
          query = query.eq(
            translatedCol,
            translateVal(this.table, op.col, op.val),
          );
        } else if (op.type === "in") {
          query = query.in(
            translatedCol,
            translateVal(this.table, op.col, op.vals),
          );
        } else if (op.type === "ilike") {
          query = query.ilike(translatedCol, op.val);
        } else if (op.type === "or") {
          query = query.or(op.filters, op.opts || {});
        } else if (op.type === "order") {
          query = query.order(translatedCol, op.opts);
        } else if (op.type === "limit") {
          query = query.limit(op.n);
        } else if (op.type === "range") {
          query = query.range(op.from, op.to);
        } else if (op.type === "maybeSingle") {
          query = query.maybeSingle();
        } else if (op.type === "single") {
          query = query.single();
        }
      }

      const response = await query;
      if (response.error) {
        return response;
      }

      if (response.data) {
        if (Array.isArray(response.data)) {
          response.data = response.data.map((row) =>
            mapResultRow(row, this.table),
          );
        } else {
          response.data = mapResultRow(response.data, this.table);
        }
      }
      return response;
    } catch (e) {
      console.error("Error executing wrapped Supabase query:", e);
      return { data: null, error: e };
    }
  }

  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch(onrejected) {
    return this.execute().catch(onrejected);
  }
}

const supabaseWrapper = {
  auth: client.auth,
  storage: client.storage,
  channel: client.channel,
  from: (table) => new WrappedQuery(table),
};

module.exports = supabaseWrapper;

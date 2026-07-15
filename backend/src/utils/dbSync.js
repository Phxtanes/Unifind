const supabase = require("../config/supabase");
const localDb = require("../config/localDb");

let isSyncing = false;

async function checkSupabaseConnection() {
  try {
    const { error } = await supabase
      .from("categories")
      .select("category_id")
      .limit(1);
    return !error;
  } catch (e) {
    return false;
  }
}

async function syncLocalDbToSupabase() {
  if (isSyncing) return;

  const isConnected = await checkSupabaseConnection();
  if (!isConnected) {
    console.log(
      "🔌 [Sync] ไม่สามารถติดต่อฐานข้อมูล Supabase ได้ในขณะนี้ ขอข้ามรอบการซิงค์ข้อมูล",
    );
    return;
  }

  isSyncing = true;
  console.log(
    "🔄 [Sync] เริ่มต้นการตรวจสอบข้อมูลแคชออฟไลน์ใน local_db.json...",
  );

  try {
    const db = localDb.loadLocalDb();

    const localPersons = (db.persons || []).filter((p) => p.person_id !== 1);
    const localLostItems = db.lost_items || [];

    if (localPersons.length === 0 && localLostItems.length === 0) {
      console.log(
        "✅ [Sync] ข้อมูลบนคลังท้องถิ่นตรงกับเซิร์ฟเวอร์หลักแล้ว ไม่พบข้อมูลตกค้าง",
      );
      isSyncing = false;
      return;
    }

    console.log(
      `🔄 [Sync] พบผู้ใช้ออฟไลน์รอซิงก์ ${localPersons.length} ราย และรายการแจ้งของหาย ${localLostItems.length} รายการ`,
    );

    const personIdMapping = {};

    for (const person of localPersons) {
      try {
        let query = supabase.from("persons").select("person_id");
        if (person.email) {
          query = query.eq("email", person.email);
        } else if (person.phone) {
          query = query.eq("phone", person.phone);
        } else {
          continue;
        }

        const { data: existing, error: selectErr } = await query.maybeSingle();
        if (selectErr) throw selectErr;

        if (existing) {
          console.log(
            `[Sync] ผู้ใช้ ${person.email || person.phone} มีอยู่แล้วบนฐานข้อมูลจริง ID: ${existing.person_id}`,
          );
          personIdMapping[person.person_id] = existing.person_id;
        } else {
          const { data: inserted, error: insertErr } = await supabase
            .from("persons")
            .insert({
              person_type: person.person_type || "STUDENT",
              full_name: person.full_name,
              student_id: person.student_id,
              email: person.email,
              phone: person.phone,
            })
            .select()
            .single();

          if (insertErr) throw insertErr;
          console.log(
            `[Sync] ซิงก์ข้อมูลบุคคลสำเร็จ: ${person.email || person.phone} -> Supabase Real ID: ${inserted.person_id}`,
          );
          personIdMapping[person.person_id] = inserted.person_id;
        }
      } catch (err) {
        console.error(
          `❌ [Sync] เกิดข้อผิดพลาดในการซิงก์บุคคล ${person.email || person.phone}:`,
          err.message,
        );
        isSyncing = false;
        return;
      }
    }

    const remainingLostItems = [];
    for (const item of localLostItems) {
      try {
        let supabaseReporterId = personIdMapping[item.reporter_id];

        if (!supabaseReporterId) {
          if (item.reporter_id === 1) {
            const { data: sysUser } = await supabase
              .from("persons")
              .select("person_id")
              .eq("email", "student@utcc.ac.th")
              .maybeSingle();
            if (sysUser) supabaseReporterId = sysUser.person_id;
          } else {
            const localPerson = db.persons.find(
              (p) => p.person_id === item.reporter_id,
            );
            if (localPerson) {
              let query = supabase.from("persons").select("person_id");
              if (localPerson.email) {
                query = query.eq("email", localPerson.email);
              } else if (localPerson.phone) {
                query = query.eq("phone", localPerson.phone);
              }
              const { data: match } = await query.maybeSingle();
              if (match) supabaseReporterId = match.person_id;
            }
          }
        }

        if (!supabaseReporterId) {
          const { data: fallbackPerson } = await supabase
            .from("persons")
            .select("person_id")
            .limit(1)
            .maybeSingle();
          if (fallbackPerson) {
            supabaseReporterId = fallbackPerson.person_id;
          } else {
            remainingLostItems.push(item);
            continue;
          }
        }

        const { error: insertErr } = await supabase.from("lost_items").insert({
          item_name: item.item_name,
          category_id: item.category_id,
          location_id: item.location_id,
          floor: item.floor || "",
          lost_datetime: item.lost_datetime,
          description: item.description,
          status: item.status || "LOST",
          reporter_id: supabaseReporterId,
        });

        if (insertErr) throw insertErr;
        console.log(
          `[Sync] ซิงก์ของหายขึ้นคลังหลักสำเร็จ: "${item.item_name}"`,
        );
      } catch (err) {
        console.error(
          `❌ [Sync] เกิดข้อผิดพลาดในการซิงก์ของหาย "${item.item_name}":`,
          err.message,
        );
        remainingLostItems.push(item);
      }
    }

    const latestDb = localDb.loadLocalDb();

    const syncedPersonIds = localPersons
      .filter((p) => personIdMapping[p.person_id] !== undefined)
      .map((p) => p.person_id);

    const remainingLostItemIds = new Set(
      remainingLostItems.map((item) => item.lost_item_id),
    );
    const syncedLostItems = localLostItems.filter(
      (item) => !remainingLostItemIds.has(item.lost_item_id),
    );
    const syncedLostItemIds = syncedLostItems.map((item) => item.lost_item_id);

    latestDb.persons = (latestDb.persons || []).filter(
      (p) => p.person_id === 1 || !syncedPersonIds.includes(p.person_id),
    );
    latestDb.lost_items = (latestDb.lost_items || []).filter(
      (item) => !syncedLostItemIds.includes(item.lost_item_id),
    );

    localDb.saveLocalDb(latestDb);

    console.log("✅ [Sync] เสร็จสิ้นรอบการซิงโครไนซ์ข้อมูลออฟไลน์เรียบร้อย");
  } catch (mainErr) {
    console.error(
      "❌ [Sync] เกิดข้อผิดพลาดร้ายแรงระหว่างกระบวนการซิงค์ข้อมูล:",
      mainErr,
    );
  } finally {
    isSyncing = false;
  }
}

function startPeriodicSync(intervalMs = 5 * 60 * 1000) {
  syncLocalDbToSupabase();

  setInterval(() => {
    syncLocalDbToSupabase();
  }, intervalMs);

  console.log(
    `⏰ [Sync] ระบบซิงโครไนซ์ออฟไลน์พร้อมทำงาน วงรอบประเมินทุกๆ ${intervalMs / 1000 / 60} นาที`,
  );
}

module.exports = {
  syncLocalDbToSupabase,
  startPeriodicSync,
};

const fs = require("fs");
const path = require("path");

const localDbPath = path.join(__dirname, "../../uploads/local_db.json");

function loadLocalDb() {
  try {
    if (!fs.existsSync(localDbPath)) {
      const initial = {
        lost_items: [],
        items: [
          {
            item_id: 1,
            item_name: "กระเป๋าสตางค์หนังสีน้ำตาล",
            category_id: 2,
            location_id: 1,
            floor: "2",
            found_date: new Date().toISOString(),
            description: JSON.stringify({
              textDescription: "กระเป๋าหนังผู้ชาย มีบัตรนักศึกษา UTCC ข้างใน",
              finder_universityEmail: "student@utcc.ac.th",
            }),
            status: "STORED",
            finder_id: 1,
          },
          {
            item_id: 2,
            item_name: "iPad Pro พร้อม Apple Pencil",
            category_id: 3,
            location_id: 3,
            floor: "",
            found_date: new Date().toISOString(),
            description: JSON.stringify({
              textDescription:
                "ไอแพดมีเคสสีเขียวพาสเทล ลืมวางไว้ที่โรงอาหารหลัก",
              finder_universityEmail: "student@utcc.ac.th",
            }),
            status: "STORED",
            finder_id: 1,
          },
        ],
        persons: [
          {
            person_id: 1,
            full_name: "System User",
            email: "student@utcc.ac.th",
          },
        ],
      };
      if (!fs.existsSync(path.dirname(localDbPath))) {
        fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
      }
      fs.writeFileSync(localDbPath, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = fs.readFileSync(localDbPath, "utf8");
    return JSON.parse(data || "{}");
  } catch (e) {
    console.error("Error loading local DB:", e);
    return { lost_items: [], items: [], persons: [] };
  }
}

function saveLocalDb(db) {
  try {
    if (!fs.existsSync(path.dirname(localDbPath))) {
      fs.mkdirSync(path.dirname(localDbPath), { recursive: true });
    }
    fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Error saving local DB:", e);
  }
}

function getLocalFoundItems() {
  const db = loadLocalDb();
  return db.items || [];
}

function getLocalLostItems() {
  const db = loadLocalDb();
  return db.lost_items || [];
}

function getOrCreateLocalPerson(email) {
  const db = loadLocalDb();
  const existing = db.persons.find(
    (p) => p.email && p.email.toLowerCase() === email.toLowerCase(),
  );
  if (existing) return existing.person_id;
  const newId = db.persons.length + 1;
  db.persons.push({
    person_id: newId,
    full_name: email.split("@")[0],
    email: email,
  });
  saveLocalDb(db);
  return newId;
}

function insertLocalLostItem(item) {
  const db = loadLocalDb();
  const newId = db.lost_items.length + 1;
  const newItem = {
    lost_item_id: newId,
    ...item,
  };
  db.lost_items.push(newItem);
  saveLocalDb(db);
  return newItem;
}

module.exports = {
  loadLocalDb,
  saveLocalDb,
  getLocalFoundItems,
  getLocalLostItems,
  getOrCreateLocalPerson,
  insertLocalLostItem,
};

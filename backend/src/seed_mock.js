const supabase = require('./config/supabase');

async function seed() {
  console.log('🌱 Starting Unifind Mock Data Seeding (with corrected Lockers L0101-L1202)...');

  try {
    // 0. Clean up previous seeded items to avoid duplicates
    console.log('Cleaning up previous seed data...');
    await supabase.from('items').delete().neq('item_id', 0);
    await supabase.from('lost_items').delete().neq('lost_item_id', 0);
    await supabase.from('persons').delete().neq('person_id', 0);

    // 1. Fetch categories
    let { data: categories } = await supabase.from('categories').select('*');
    if (!categories || categories.length === 0) {
      console.log('Inserting default categories...');
      const { data: newCats, error } = await supabase.from('categories').insert([
        { category_name: 'เอกสาร', description: 'บัตรประชาชน บัตรนักศึกษา สมุดบัญชี แฟ้มเอกสาร' },
        { category_name: 'กระเป๋า', description: 'กระเป๋าสตางค์ กระเป๋าเป้ กระเป๋าถือ' },
        { category_name: 'โทรศัพท์/แท็บเล็ต', description: 'สมาร์ทโฟน ไอแพด แท็บเล็ต' },
        { category_name: 'กุญแจ', description: 'กุญแจห้อง กุญแจรถ พวงกุญแจ' },
        { category_name: 'เครื่องประดับ/นาฬิกา', description: 'นาฬิกา แหวน สร้อยคอ ต่างหู หมวก' },
        { category_name: 'อุปกรณ์ไอที/สายชาร์จ', description: 'พาวเวอร์แบงก์ หูฟัง สายชาร์จ แฟลชไดรฟ์' },
        { category_name: 'เครื่องใช้ไฟฟ้าพกพา', description: 'พัดลมพกพา กล้องถ่ายรูป เครื่องคิดเลข' },
        { category_name: 'อุปกรณ์การเรียน', description: 'สมุดบันทึก หนังสือเตรียมสอบ กล่องดินสอ' },
        { category_name: 'อื่น ๆ', description: 'ร่ม แก้วน้ำ เสื้อกันหนาว ของใช้อื่นๆ' }
      ]).select();
      if (error) throw error;
      categories = newCats;
    }
    console.log(`✅ Loaded ${categories.length} categories.`);

    // 2. Fetch locations
    let { data: locations } = await supabase.from('locations').select('*');
    if (!locations || locations.length === 0) {
      console.log('Inserting default locations...');
      const { data: newLocs, error } = await supabase.from('locations').insert([
        { location_name: 'อาคาร 24 (ตึกใบเรือ)', floor: 1, description: 'ใต้ตึกใบเรือ / ล็อบบี้ประชาสัมพันธ์' },
        { location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)', floor: 2, description: 'ห้องเรียนรวมชั้น 2' },
        { location_name: 'โรงอาหารกลาง UTCC', floor: 1, description: 'โซนขายอาหารหลักชั้นล่าง' },
        { location_name: 'สำนักหอสมุดกลาง (อาคาร 24)', floor: 3, description: 'โซนพื้นที่การเรียนรู้ชั้น 3' }
      ]).select();
      if (error) throw error;
      locations = newLocs;
    }
    console.log(`✅ Loaded ${locations.length} locations.`);

    // Helper to get random category / location IDs
    const getCatId = (name) => {
      const cat = categories.find(c => c.category_name.includes(name) || name.includes(c.category_name));
      return cat ? cat.category_id : categories[0].category_id;
    };
    const getLocId = (name) => {
      const loc = locations.find(l => l.location_name.includes(name) || name.includes(l.location_name));
      return loc ? loc.location_id : locations[0].location_id;
    };

    // 3. Fetch status mappings
    const { data: foundStatuses } = await supabase.from('found_item_statuses').select('*');
    const { data: lostStatuses } = await supabase.from('lost_item_statuses').select('*');
    const getFoundStatusId = (code) => foundStatuses.find(s => s.status_code === code).status_id;
    const getLostStatusId = (code) => lostStatuses.find(s => s.status_code === code).status_id;

    // 4. Create mock persons (reporters, finders, claimers)
    console.log('Creating mock persons...');
    const { data: persons, error: pErr } = await supabase.from('persons').insert([
      { person_type: 'STUDENT', full_name: 'สมชาย รักเรียน', student_id: '6601051234', email: 'somchai@student.utcc.ac.th', phone: '0812345678', department: 'คณะวิศวกรรมศาสตร์' },
      { person_type: 'STUDENT', full_name: 'สมหญิง จริงใจ', student_id: '6502045678', email: 'somying@student.utcc.ac.th', phone: '0898765432', department: 'คณะบัญชี' },
      { person_type: 'STAFF', full_name: 'อาจารย์สุดา วงศ์สว่าง', student_id: '', email: 'suda.won@utcc.ac.th', phone: '0867890123', department: 'คณะมนุษยศาสตร์' },
      { person_type: 'EXTERNAL', full_name: 'ณรงค์ รักชาติ', student_id: '', email: 'narong@gmail.com', phone: '0854321098', department: 'บุคคลภายนอก' },
      { person_type: 'STUDENT', full_name: 'พิทยาภรณ์ พงศ์สิริ', student_id: '6609021234', email: 'pittayaporn@student.utcc.ac.th', phone: '0822233445', department: 'คณะนิเทศศาสตร์' },
      { person_type: 'STUDENT', full_name: 'เจษฎา เด่นประเสริฐ', student_id: '6403012938', email: 'jessada@student.utcc.ac.th', phone: '0955511223', department: 'คณะวิทยาศาสตร์' },
      { person_type: 'STAFF', full_name: 'ปรีชา อินทร', student_id: '', email: 'preecha.int@utcc.ac.th', phone: '0812233446', department: 'กองอาคารสถานที่' },
      { person_type: 'STUDENT', full_name: 'วิภาดา รัตนมณี', student_id: '6504018374', email: 'wipada@student.utcc.ac.th', phone: '0993827162', department: 'คณะหอการค้าไทย' }
    ]).select();
    if (pErr) throw pErr;
    console.log(`✅ Loaded ${persons.length} persons.`);

    // 5. Seed 15 Found/Stored Items (พบของ)
    console.log('Seeding 15 Found/Stored Items...');
    const foundItemsToSeed = [
      {
        item_name: 'กระเป๋าสตางค์หนังสีดำ',
        category_name: 'กระเป๋า',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'กระเป๋าสตางค์หนังแท้สีดำ ยี่ห้อ Coach ข้างในมีเงินสดเล็กน้อยและบัตรประชาชนนอกมหาวิทยาลัย',
        image_url: 'https://images.unsplash.com/photo-1627124118303-164434ea97b3?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0101',
        status_code: 'STORED'
      },
      {
        item_name: 'พวงกุญแจรถยนต์ Honda',
        category_name: 'กุญแจ',
        location_name: 'อาคาร 24 (ตึกใบเรือ)',
        description: 'กุญแจรีโมทรถยนต์ Honda พร้อมพวงกุญแจตุ๊กตาหมีสีน้ำตาลพาสเทลตกแต่ง',
        image_url: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0102',
        status_code: 'STORED'
      },
      {
        item_name: 'สมุดโน้ตปกแข็งลายการ์ตูน',
        category_name: 'อุปกรณ์การเรียน',
        location_name: 'สำนักหอสมุดกลาง (อาคาร 24)',
        description: 'สมุดบันทึกเล่มหนาปกสีฟ้าลายการ์ตูนน้องหมีชิบะ ลืมไว้ที่โต๊ะอ่านหนังสือชั้น 3',
        image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0201',
        status_code: 'FOUND'
      },
      {
        item_name: 'หูฟังไร้สาย AirPods Pro',
        category_name: 'อุปกรณ์ไอที/สายชาร์จ',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'เคสแอร์พอดโปรสีขาวพร้อมเคสพลาสติกกันกระแทกสีเหลืองโปร่งแสง',
        image_url: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0202',
        status_code: 'STORED'
      },
      {
        item_name: 'กระบอกน้ำเก็บความเย็นสีพาสเทล',
        category_name: 'อื่น ๆ',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'กระบอกน้ำยี่ห้อ Stanley สีชมพูพาสเทล ขนาด 20 ออนซ์ สภาพใหม่มาก',
        image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0301',
        status_code: 'STORED'
      },
      {
        item_name: 'แว่นสายตากรอบโลหะสีทอง',
        category_name: 'เครื่องประดับ/นาฬิกา',
        location_name: 'สำนักหอสมุดกลาง (อาคาร 24)',
        description: 'แว่นตากรอบบางกลมสีโรสโกลด์ พร้อมผ้าเช็ดแว่นสีครีมในซองสีน้ำตาลลืมไว้ที่คอมพิวเตอร์ชั้น 2',
        image_url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0302',
        status_code: 'STORED'
      },
      {
        item_name: 'ร่มพับกันแดดสีน้ำเงิน',
        category_name: 'อื่น ๆ',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'ร่มพับขนาด 3 ตอน ยี่ห้อหมีแพนด้า สีน้ำเงินเข้มลืมไว้หน้าราวแขวนร่มตึกเรียน',
        image_url: 'https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0401',
        status_code: 'FOUND'
      },
      {
        item_name: 'ปากกาโลหะยี่ห้อ Parker',
        category_name: 'อุปกรณ์การเรียน',
        location_name: 'อาคาร 24 (ตึกใบเรือ)',
        description: 'ปากกาหัวลูกลื่นด้ามโลหะสีทองเหลืองปัดขนแมว สลักชื่อภาษาอังกฤษลางๆ',
        image_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0402',
        status_code: 'STORED'
      },
      {
        item_name: 'สายชาร์จ iPhone สีขาว',
        category_name: 'อุปกรณ์ไอที/สายชาร์จ',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'สายชาร์จ USB-C to Lightning สีขาวของแท้ ความยาว 1 เมตร สภาพใช้งาน',
        image_url: 'https://images.unsplash.com/photo-1608248597481-496100c80836?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0501',
        status_code: 'FOUND'
      },
      {
        item_name: 'เครื่องคิดเลข Casio สีเงิน',
        category_name: 'เครื่องใช้ไฟฟ้าพกพา',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'เครื่องคิดเลขปุ่มกดสีบรอนซ์เงิน ด้านหลังสลักรหัสวิชาการเงินไว้เล็กน้อย',
        image_url: 'https://images.unsplash.com/photo-1616781296184-a15d5ec25c76?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0502',
        status_code: 'STORED'
      },
      {
        item_name: 'นาฬิกาข้อมือสายหนังสีน้ำตาล',
        category_name: 'เครื่องประดับ/นาฬิกา',
        location_name: 'สำนักหอสมุดกลาง (อาคาร 24)',
        description: 'นาฬิกาแอนะล็อกหน้าปัดทองเหลือง สายหนังสีโอ๊คเข้ม ลืมไว้ในห้องน้ำหญิงชั้น 4',
        image_url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0601',
        status_code: 'STORED'
      },
      {
        item_name: 'กระเป๋าเป้สีเทาแบรนด์ Anello',
        category_name: 'กระเป๋า',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'กระเป๋าเป้ผ้าแคนวาสสีเทาอ่อน มีรอยเปื้อนสีเหลืองมุมขวาล่าง เล่มรายงานยังค้างอยู่ข้างใน',
        image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0602',
        status_code: 'STORED'
      },
      {
        item_name: 'หมวกแก๊ปสีดำปักลาย UTCC',
        category_name: 'เครื่องประดับ/นาฬิกา',
        location_name: 'อาคาร 24 (ตึกใบเรือ)',
        description: 'หมวกสีดำสนิท ทรงเบสบอล ด้านหน้าปักตัวอักษรสีทองเป็นสัญลักษณ์ของมหาวิทยาลัยหอการค้าไทย',
        image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0701',
        status_code: 'FOUND'
      },
      {
        item_name: 'พัดลมพกพาสีชมพู',
        category_name: 'เครื่องใช้ไฟฟ้าพกพา',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'พัดลมไร้สายขนาดเล็ก แบตเตอรี่พกพา ชาร์จสาย Micro USB วางทิ้งไว้ที่ม้าหินอ่อนด้านนอก',
        image_url: 'https://images.unsplash.com/photo-1619441207978-3d326c46e2c9?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0702',
        status_code: 'STORED'
      },
      {
        item_name: 'แฟ้มเอกสารสีน้ำเงิน',
        category_name: 'เอกสาร',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'แฟ้มหนังใส่ชีทเรียนพิมพ์หน้าปกลายประมวลคำสอนวิชาการจัดการทรัพยากรมนุษย์',
        image_url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0801',
        status_code: 'STORED'
      }
    ];

    const foundItemsRows = foundItemsToSeed.map((item, index) => {
      const finder = persons[index % persons.length];
      return {
        item_name: item.item_name,
        category_id: getCatId(item.category_name),
        location_id: getLocId(item.location_name),
        description: item.description,
        status_id: getFoundStatusId(item.status_code),
        locker_id: item.locker_id,
        image_url: item.image_url,
        found_date: new Date(Date.now() - (index * 12 * 3600 * 1000)).toISOString(),
        finder_id: finder.person_id,
        created_by: 1
      };
    });

    const { error: fErr } = await supabase.from('items').insert(foundItemsRows);
    if (fErr) throw fErr;
    console.log('✅ Successfully seeded 15 Found items.');

    // 6. Seed 15 Claimed Items (คืนแล้ว)
    console.log('Seeding 15 Claimed Items...');
    const claimedItemsToSeed = [
      {
        item_name: 'iPad Air สีสเปซเกรย์พร้อมปากกา',
        category_name: 'โทรศัพท์/แท็บเล็ต',
        location_name: 'สำนักหอสมุดกลาง (อาคาร 24)',
        description: 'ไอแพดมีเคสหนังสีเขียวพาสเทล ด้านหลังเคสมีสติกเกอร์รูปน้องกระต่ายสามตัว',
        image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0802',
        remark: 'เจ้าของแสดงรูปภาพหน้าจอล็อคอินและรหัสผ่านเพื่อยืนยันตัวตนสำเร็จ'
      },
      {
        item_name: 'กระเป๋าเป้สะพายหลังสีดำโน้ตบุ๊ก',
        category_name: 'กระเป๋า',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'กระเป๋าเป้ยี่ห้อ Targus ขนาดใส่โน้ตบุ๊ก 15 นิ้ว มีหัวชาร์จโน้ตบุ๊ก Asus สีดำบรรจุอยู่ข้างใน',
        image_url: 'https://images.unsplash.com/photo-1614713570650-705a109a15cd?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0901',
        remark: 'ผู้รับมีรูปภาพเปรียบเทียบบัตรนักศึกษาตรงกับบัตรผู้ลงทะเบียนเรียน'
      },
      {
        item_name: 'พวงกุญแจห้องพักหมายเลข 402',
        category_name: 'กุญแจ',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'กุญแจเหล็กสีบรอนซ์ทองทองเหลืองห้อยแผ่นอะคริลิคเขียนตัวเลขสีแดง 402 เด่นชัด',
        image_url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0902',
        remark: 'เจ้าของนำคีย์การ์ดสำรองของหอพักมาแสดงประกอบ'
      },
      {
        item_name: 'กระติกน้ำสแตนเลสยี่ห้อ HydroFlask',
        category_name: 'อื่น ๆ',
        location_name: 'สำนักหอสมุดกลาง (อาคาร 24)',
        description: 'ขวดสแตนเลสสูญญากาศสีเงิน ขนาดความจุ 24 ออนซ์ มีรอยบุบเล็กน้อยที่ก้นขวด',
        image_url: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L1001',
        remark: 'เจ้าของนำรหัสใบเสร็จซื้อจากร้านมาเทียบความสอดคล้อง'
      },
      {
        item_name: 'เสื้อกันหนาวมีฮู้ดสีครีม',
        category_name: 'อื่น ๆ',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'เสื้อกันหนาวผ้าฝ้ายตัวหนา มีปักสัญลักษณ์หน้ายิ้มสีแดงบริเวณต้นแขนซ้าย ยี่ห้อ H&M',
        image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L1002',
        remark: 'เจ้าของชี้จุดสังเกตรอยคราบเปื้อนที่ปกคอเสื้อตรงตำแหน่งเป๊ะ'
      },
      {
        item_name: 'พาวเวอร์แบงก์ Eloop 20000mAh',
        category_name: 'อุปกรณ์ไอที/สายชาร์จ',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'แบตสำรองพกพาสีเขียวทหารเข้ม มีรอบขีดข่วนด้านหน้าแบบลายทางตรงแนวตั้ง',
        image_url: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b17c?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L1101',
        remark: 'ตรวจสอบหลักฐานข้อมูลยี่ห้อและการใช้งานประวัติการใช้ตรง'
      },
      {
        item_name: 'กระเป๋าเครื่องสำอางลายดอกไม้',
        category_name: 'กระเป๋า',
        location_name: 'สำนักหอสมุดกลาง (อาคาร 24)',
        description: 'กระเป๋าผ้ามีซิปขนาดกลาง ลวดลายดอกทิวลิปสีแดง พื้นหลังสีครีม',
        image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L1102',
        remark: 'ยืนยันเนื้อหาด้านในลิปสติกและตลับแป้งพัฟแบรนด์ตรงกันหมด'
      },
      {
        item_name: 'กล่องแว่นสายตาสีน้ำตาลลายไม้',
        category_name: 'อื่น ๆ',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'กล่องใส่แว่นทำจากพลาสติกแข็งหุ้มผ้าลายเปลือกไม้โอ๊คสีน้ำตาลอ่อน มีตราสกรีนชื่อร้านแว่นท็อปเจริญ',
        image_url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L1201',
        remark: 'คืนให้เจ้าของแว่นสายตาสั้นเรียบร้อย'
      },
      {
        item_name: 'หูฟังครอบหู Sony WH-1000XM4',
        category_name: 'อุปกรณ์ไอที/สายชาร์จ',
        location_name: 'สำนักหอสมุดกลาง (อาคาร 24)',
        description: 'หูฟังตัดเสียงรบกวนไร้สายระดับพรีเมียม สีดำเงา บรรจุในกล่องเคสซิปแบบกลมลายคาร์บอนไฟเบอร์',
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L1202',
        remark: 'ตรวจสอบรหัส Serial Number ที่แผงด้านในตรงกับกล่องซื้อขายของแท้'
      },
      {
        item_name: 'แฟลชไดรฟ์ SanDisk สีแดง 64GB',
        category_name: 'อุปกรณ์ไอที/สายชาร์จ',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'ไดรฟ์บันทึกข้อมูลขนาดจิ๋ว รุ่นบอดี้สไลด์สีแดงสลับดำ มีห่วงคล้องสายไนลอนถักสีน้ำเงินห้อยอยู่',
        image_url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0101',
        remark: 'ระบุไฟล์งานนำเสนอวิชาวิจัยตลาดในแฟลชไดรฟ์ได้ตรงหน้าหลัก'
      },
      {
        item_name: 'กระเป๋าดินสอลายการ์ตูนสีฟ้า',
        category_name: 'กระเป๋า',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'กระเป๋าใส่เครื่องเขียนขนาดความกว้าง 20 ซม. ลายสเปซด็อกสีฟ้าใสโปร่งใส',
        image_url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0102',
        remark: 'ผู้มารับแจ้งชื่อยี่ห้อดินสอกดแบรนด์สิงคโปร์ข้างในถูกต้อง'
      },
      {
        item_name: 'กล้องถ่ายภาพฟิล์มสีเหลือง',
        category_name: 'เครื่องใช้ไฟฟ้าพกพา',
        location_name: 'อาคาร 24 (ตึกใบเรือ)',
        description: 'กล้องฟิล์มทอยยี่ห้อ Kodak M35 สีเหลืองพาสเทลสดใส ยังไม่ใส่เคสป้องกันใดๆ',
        image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0201',
        remark: 'ผู้มารับมีภาพเซลฟี่ที่ถือกล้องตัวนี้อยู่เพื่อแสดงความเป็นเจ้าของ'
      },
      {
        item_name: 'นาฬิกาสมาร์ทวอทช์สีชมพู',
        category_name: 'เครื่องประดับ/นาฬิกา',
        location_name: 'สำนักหอสมุดกลาง (อาคาร 24)',
        description: 'สมาร์ทวอทช์สายซิลิโคนอ่อนนุ่มสีชมพู รุ่น Apple Watch SE ขนาด 40 มม.',
        image_url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0202',
        remark: 'เจ้าของปลดล็อครหัสผ่านหน้าจอเข้าหน้าโฮมสำเร็จ'
      },
      {
        item_name: 'หนังสือเตรียมสอบ TOEIC สีส้ม',
        category_name: 'อุปกรณ์การเรียน',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'หนังสือคู่มือตะลุยโจทย์โทอิคของสำนักพิมพ์เกรทไอเดีย เล่มปกหนาโทนสีส้มและเหลืองสะดุดตา',
        image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0301',
        remark: 'มีลายเซ็นชื่อย่อกำกับไว้ที่ขอบล่างของหน้าสารบัญด้านใน'
      },
      {
        item_name: 'ร่มยาวลายสก็อตสีเขียว',
        category_name: 'อื่น ๆ',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'ร่มขนาดยาวแบบด้ามโค้งพลาสติกใส ตัวผ้าร่มเป็นลายสก็อตช่องสี่เหลี่ยมสีเขียวแก่สลับครีม',
        image_url: 'https://images.unsplash.com/photo-1534797258760-1bd2cc95a5bd?w=500&auto=format&fit=crop&q=60',
        locker_id: 'L0302',
        remark: 'บอกตอกรอยร้าวที่ปลายยางสีดำของด้ามจับได้ตรงตามจริง'
      }
    ];

    const claimedItemsRows = claimedItemsToSeed.map((item, index) => {
      const finder = persons[index % persons.length];
      const claimer = persons[(index + 3) % persons.length];
      return {
        item_name: item.item_name,
        category_id: getCatId(item.category_name),
        location_id: getLocId(item.location_name),
        description: item.description,
        status_id: getFoundStatusId('CLAIMED'),
        locker_id: item.locker_id,
        image_url: item.image_url,
        found_date: new Date(Date.now() - (index * 24 * 3600 * 1000) - (5 * 24 * 3600 * 1000)).toISOString(),
        claim_date: new Date(Date.now() - (index * 12 * 3600 * 1000)).toISOString(),
        finder_id: finder.person_id,
        claimer_id: claimer.person_id,
        remark: item.remark,
        created_by: 1
      };
    });

    const { error: cErr } = await supabase.from('items').insert(claimedItemsRows);
    if (cErr) throw cErr;
    console.log('✅ Successfully seeded 15 Claimed items.');

    // 7. Seed 10 Lost Items (ของหาย - ไม่มีรูป)
    console.log('Seeding 10 Lost Items...');
    const lostItemsToSeed = [
      {
        item_name: 'บัตรนักศึกษา UTCC ชื่อนายวีรภัทร',
        category_name: 'เอกสาร',
        location_name: 'อาคาร 24 (ตึกใบเรือ)',
        description: 'บัตรประจำตัวนักศึกษาออกโดยมหาวิทยาลัยหอการค้าไทย รหัสนักศึกษาลงท้ายด้วย 0021'
      },
      {
        item_name: 'สมุดบัญชีธนาคารกสิกรไทย',
        category_name: 'เอกสาร',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'สมุดฝากธนาคารเล่มสีเขียวเข้ม มีซองพลาสติกใสครอบอยู่ ทำตกแถวหน้าร้านกาแฟอเมซอนใต้ตึก'
      },
      {
        item_name: 'พวงกุญแจลายหมีพูห์สีเหลือง',
        category_name: 'กุญแจ',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'กุญแจไขห้องพักไขควงหัวกลม ห้อยพวงตุ๊กตาซิลิโคนลายหมีพูห์ใส่เสื้อสีแดงสดใส'
      },
      {
        item_name: 'สายชาร์จ Type-C สีเทายาว 2 เมตร',
        category_name: 'อุปกรณ์ไอที/สายชาร์จ',
        location_name: 'สำนักหอสมุดกลาง (อาคาร 24)',
        description: 'สายชาร์จแบบไนลอนถักสีเทาเข้ม แบรนด์ Anker ลืมเสียบคาสถานีชาร์จไฟชั้น 2'
      },
      {
        item_name: 'กระเป๋าเป้ผ้าใบสีเหลือง',
        category_name: 'กระเป๋า',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'กระเป๋าเป้สะพายหลังทำจากผ้าแคนวาสหนาโทนสีมัสตาร์ดสกรีนรูปการ์ตูนแมวสีส้มด่านหน้า'
      },
      {
        item_name: 'เครื่องคิดเลข Casio fx-991EX',
        category_name: 'เครื่องใช้ไฟฟ้าพกพา',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'เครื่องคิดเลขสำหรับคำนวณสถิติและคณิตศาสตร์ชั้นสูง ปุ่มสีดำกรอบคาร์บอน มีสติกเกอร์เขียนชื่อภาษาไทยด้านหลัง'
      },
      {
        item_name: 'หูฟังไร้สาย Samsung Galaxy Buds',
        category_name: 'อุปกรณ์ไอที/สายชาร์จ',
        location_name: 'สำนักหอสมุดกลาง (อาคาร 24)',
        description: 'หูฟังบลูทูธไร้สาย ตัวเครื่องสีบรอนซ์เงินบรรจุในกล่องเคสชาร์จทรงรีสีดำขุ่น'
      },
      {
        item_name: 'กระบอกน้ำสีเหลืองลายเป็ด',
        category_name: 'อื่น ๆ',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'แก้วน้ำสแตนเลสทรงสูง สีเหลืองสดมีหูหิ้วพลาสติกสีดำด้านบน ลายลูกเป็ดก้มหัวสลักเด่นชัด'
      },
      {
        item_name: 'กล่องแว่นตาพลาสติกสีใส',
        category_name: 'อื่น ๆ',
        location_name: 'อาคาร 6 (คณะบริหารธุรกิจ)',
        description: 'ซองใส่แว่นตาทรงแบน ทำจากยางซิลิโคนกึ่งโปร่งแสง มีฝากดล็อกแบบปุ่มเหล็ก'
      },
      {
        item_name: 'เสื้อแจ็กเก็ตยีนส์สีซีด',
        category_name: 'อื่น ๆ',
        location_name: 'โรงอาหารกลาง UTCC',
        description: 'เสื้อแจ็คเก็ตยีนส์ไซส์ L สีครามฟอก มีรอยปะวงกลมสีขาวตรงกลางหลัง ยี่ห้อ Levi\'s'
      }
    ];

    const lostItemsRows = lostItemsToSeed.map((item, index) => {
      const reporter = persons[index % persons.length];
      return {
        item_name: item.item_name,
        category_id: getCatId(item.category_name),
        location_id: getLocId(item.location_name),
        description: item.description,
        status_id: getLostStatusId('LOST'),
        image_url: null,
        lost_datetime: new Date(Date.now() - (index * 15 * 3600 * 1000)).toISOString(),
        reporter_id: reporter.person_id
      };
    });

    const { error: lErr } = await supabase.from('lost_items').insert(lostItemsRows);
    if (lErr) throw lErr;
    console.log('✅ Successfully seeded 10 Lost items (no images).');

    console.log('🎉 Seeding Completed Successfully with correct Locker IDs!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  }
}

seed();

async function run() {
  try {
    const foundRes = await fetch('http://localhost:9001/api/found-items');
    const foundData = await foundRes.json();
    console.log('FOUND API count:', foundData.items?.length, 'items:', foundData.items.map(i => ({ id: i.found_item_id, name: i.item_name, status: i.status })));
    
    const lostRes = await fetch('http://localhost:9001/api/lost-items');
    const lostData = await lostRes.json();
    console.log('LOST API count:', lostData.items?.length, 'items:', lostData.items.map(i => ({ id: i.id, name: i.name, status: i.status })));
  } catch (err) {
    console.error('API Error:', err.message);
  }
}
run();

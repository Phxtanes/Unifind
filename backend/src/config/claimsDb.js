const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../uploads/claims.json');

function loadClaims() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error loading Claims DB:', error);
    return [];
  }
}

function saveClaims(claims) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(claims, null, 2));
  } catch (error) {
    console.error('Error saving Claims DB:', error);
  }
}

exports.getClaims = () => {
  return loadClaims();
};

exports.getClaimById = (id) => {
  const claims = loadClaims();
  return claims.find(c => c.claim_id === parseInt(id)) || null;
};

exports.createClaim = ({ found_item_id, claimer_id, claimer_username, proof_description, proof_image_url }) => {
  const claims = loadClaims();
  
  // Auto-increment ID
  const lastId = claims.length > 0 ? Math.max(...claims.map(c => c.claim_id)) : 0;
  const newClaim = {
    claim_id: lastId + 1,
    found_item_id: parseInt(found_item_id),
    claimer_id: parseInt(claimer_id),
    claimer_username,
    proof_description,
    proof_image_url: proof_image_url || null,
    status: 'pending',
    claim_date: new Date().toISOString(),
    reject_reason: null
  };
  
  claims.push(newClaim);
  saveClaims(claims);
  return newClaim;
};

exports.updateClaimStatus = (id, status, reject_reason = null) => {
  const claims = loadClaims();
  const index = claims.findIndex(c => c.claim_id === parseInt(id));
  if (index === -1) return null;
  
  claims[index].status = status;
  if (reject_reason !== null) {
    claims[index].reject_reason = reject_reason;
  }
  
  saveClaims(claims);
  return claims[index];
};

exports.rejectOtherPendingClaims = (found_item_id, approved_claim_id) => {
  const claims = loadClaims();
  let updated = false;
  
  claims.forEach(c => {
    if (c.found_item_id === parseInt(found_item_id) && c.claim_id !== parseInt(approved_claim_id) && c.status === 'pending') {
      c.status = 'rejected';
      c.reject_reason = 'สิ่งของนี้ถูกส่งคืนให้กับคำร้องอื่นที่ได้รับการอนุมัติแล้ว';
      updated = true;
    }
  });
  
  if (updated) {
    saveClaims(claims);
  }
};

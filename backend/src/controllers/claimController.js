const supabase = require('../config/supabase');
const claimsDb = require('../config/claimsDb');
const lineBindings = require('../config/lineBindings');
const matchingService = require('../services/matchingService');

// Helper to get category name by ID
const getCategoryName = (categoryId) => {
  const mapping = {
    1: 'เอกสาร',
    2: 'กระเป๋า',
    3: 'โทรศัพท์',
    4: 'กุญแจ',
    5: 'เครื่องประดับ'
  };
  return mapping[categoryId] || 'อื่นๆ';
};

// POST /api/claims (Staff records a claim/return)
exports.createClaim = async (req, res) => {
  try {
    const { found_item_id, claimer_id, remark, status = 'CLAIMED', proof_description, proof_image_url } = req.body;

    if (!found_item_id || !claimer_id) {
      return res.status(400).json({ message: 'found_item_id and claimer_id are required' });
    }

    // Check if item exists and is STORED or MATCHED
    const { data: item, error: findError } = await supabase
      .from('FoundItem')
      .select('status, locker_id')
      .eq('found_item_id', found_item_id)
      .maybeSingle();

    if (findError || !item) {
      return res.status(404).json({ message: 'Found item not found' });
    }

    if (item.status === 'CLAIMED' || item.status === 'RETURNED') {
      return res.status(400).json({ message: 'Item is already claimed or unavailable' });
    }

    // Fetch claimer's username from supabase User table
    const { data: claimant } = await supabase
      .from('User')
      .select('username')
      .eq('user_id', req.userId)
      .single();

    const claim = claimsDb.createClaim({
      found_item_id: found_item_id,
      claimer_id: claimer_id,
      claimer_username: claimant ? claimant.username : 'Registered User',
      proof_description: proof_description || remark,
      proof_image_url
    });

    // Insert into Supabase Claim table for persistence
    const { error: dbClaimError } = await supabase
      .from('Claim')
      .insert({
        found_item_id: parseInt(found_item_id),
        claimer_id: parseInt(claimer_id),
        claim_date: new Date().toISOString(),
        return_date: new Date().toISOString(),
        status: status || 'CLAIMED',
        remark: remark || proof_description || null,
        created_by: req.userId
      });

    if (dbClaimError) {
      console.error('Error inserting Claim to Supabase:', dbClaimError.message);
    }

    // Update FoundItem status
    await supabase.from('FoundItem').update({ status }).eq('found_item_id', found_item_id);

    // If RETURNED or CLAIMED, free up the locker if it was in one
    if ((status === 'RETURNED' || status === 'CLAIMED') && item.locker_id) {
        await supabase.from('Locker').update({ status: 'AVAILABLE' }).eq('locker_id', item.locker_id);
    }

    res.status(201).json({ message: 'Claim recorded successfully', claim });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/claims (Get all claims)
exports.getClaims = async (req, res) => {
  try {
    const { status } = req.query;

    const localClaims = claimsDb.getClaims();
    // Filter status if query provided
    const filtered = status ? localClaims.filter(c => c.status === status) : localClaims;

    // Fetch found items and users referenced in filtered claims
    const foundItemIds = [...new Set(filtered.map(c => c.found_item_id))];
    const userIds = [...new Set(filtered.map(c => c.claimer_id))];

    let items = [];
    if (foundItemIds.length > 0) {
      const { data } = await supabase
        .from('FoundItem')
        .select('found_item_id, item_name, category_id, location_id')
        .in('found_item_id', foundItemIds);
      items = data || [];
    }

    let users = [];
    if (userIds.length > 0) {
      const { data } = await supabase
        .from('User')
        .select('user_id, username, email')
        .in('user_id', userIds);
      users = data || [];
    }

    // Populate data for frontend expected keys
    const populated = filtered.map(c => {
      const item = items.find(i => i.found_item_id === c.found_item_id);
      const user = users.find(u => u.user_id === c.claimer_id);
      return {
        id: c.claim_id,
        claim_id: c.claim_id,
        item_id: c.found_item_id,
        user_id: c.claimer_id,
        status: c.status,
        proof_description: c.proof_description,
        proof_image_url: c.proof_image_url,
        claim_date: c.claim_date,
        reject_reason: c.reject_reason,
        items: item ? { name: item.item_name, category: getCategoryName(item.category_id), place: '' } : null,
        users: user ? { username: user.username, email: user.email } : null
      };
    });

    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/claims/:id/return (Mark as RETURNED)
exports.markAsReturned = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = claimsDb.getClaimById(id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim request not found' });
    }

    if (claim.status === 'RETURNED') {
      return res.status(400).json({ message: 'Claim is already marked as returned' });
    }

    // 1. Update the claim status to approved locally
    claimsDb.updateClaimStatus(id, 'approved');

    // 2. Update the item status to CLAIMED in Supabase
    const { error: itemUpdateError } = await supabase
      .from('FoundItem')
      .update({
        status: 'CLAIMED'
      })
      .eq('found_item_id', claim.found_item_id);

    const { error: updateError } = await supabase
      .from('Claim')
      .update({ status: 'RETURNED', return_date })
      .eq('claim_id', id);

    // 3. Reject other pending claims for the same item automatically locally
    claimsDb.rejectOtherPendingClaims(claim.found_item_id, id);

    // 4. Send LINE push notification to the claimant
    const { data: user } = await supabase
      .from('User')
      .select('email')
      .eq('user_id', claim.claimer_id)
      .single();

    if (user) {
      const lineUserId = lineBindings.getLineUserId(user.email);
      if (lineUserId) {
        const { data: item } = await supabase
          .from('FoundItem')
          .select('item_name')
          .eq('found_item_id', claim.found_item_id)
          .single();

        const itemName = item ? item.item_name : 'สิ่งของสูญหาย';
        const msg = `[ระบบ Unifind] 🎉 คำร้องขอรับคืนสิ่งของสำหรับ "${itemName}" ของท่านได้รับการอนุมัติเรียบร้อยแล้ว!

ท่านสามารถติดต่อประสานงานเพื่อรับสิ่งของคืนได้ ณ จุดบริการรับของหายของมหาวิทยาลัยได้เลยครับ`;
        await matchingService.sendPushToLine(lineUserId, msg);
      }
    }

    // Update the item status
    await supabase.from('FoundItem').update({ status: 'RETURNED' }).eq('found_item_id', claim.found_item_id);

    // Free up locker
    if (claim.FoundItem?.locker_id) {
        await supabase.from('Locker').update({ status: 'AVAILABLE' }).eq('locker_id', claim.FoundItem.locker_id);
    }

    res.status(200).json({ message: 'Item marked as returned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/claims/:id/cancel
exports.cancelClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { reject_reason } = req.body;

    const claim = claimsDb.getClaimById(id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim request not found' });
    }

    if (claim.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Claim is already cancelled' });
    }

    // Update claim status to rejected locally
    claimsDb.updateClaimStatus(id, 'rejected', reject_reason || 'เอกสารหลักฐานไม่เพียงพอ');

    // Send LINE push notification to the claimant
    const { data: user } = await supabase
      .from('User')
      .select('email')
      .eq('user_id', claim.claimer_id)
      .single();

    if (user) {
      const lineUserId = lineBindings.getLineUserId(user.email);
      if (lineUserId) {
        const { data: item } = await supabase
          .from('FoundItem')
          .select('item_name')
          .eq('found_item_id', claim.found_item_id)
          .single();

        const itemName = item ? item.item_name : 'สิ่งของสูญหาย';
        const msg = `[ระบบ Unifind] ⚠️ คำร้องขอรับคืนสิ่งของสำหรับ "${itemName}" ของท่านไม่ผ่านการอนุมัติ

เหตุผลหลัก: ${reject_reason || 'หลักฐานยืนยันตัวตนหรือความเชื่อมโยงกับสิ่งของไม่ชัดเจน'}
แนะนำให้ยื่นคำร้องเข้ามาใหม่อีกครั้งพร้อมรูปถ่ายหลักฐานที่ชัดเจนมากขึ้นครับ`;
        await matchingService.sendPushToLine(lineUserId, msg);
      }
    }

    // Revert FoundItem status to STORED if it was CLAIMED
    if (claim.FoundItem?.status === 'CLAIMED') {
        await supabase.from('FoundItem').update({ status: 'STORED' }).eq('found_item_id', claim.found_item_id);
    }

    res.status(200).json({ message: 'Claim cancelled successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

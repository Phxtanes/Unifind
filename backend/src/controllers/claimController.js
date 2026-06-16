const supabase = require('../config/supabase');

// POST /api/claims (Staff records a claim/return)
exports.createClaim = async (req, res) => {
  try {
    const { found_item_id, claimer_id, remark, status = 'CLAIMED' } = req.body;

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
      return res.status(400).json({ message: 'Item is already claimed or returned' });
    }

    const claim_date = new Date().toISOString();
    const return_date = status === 'RETURNED' ? claim_date : null;

    const { data: claim, error } = await supabase
      .from('Claim')
      .insert({
        found_item_id,
        claimer_id,
        claim_date,
        return_date,
        status,
        remark,
        created_by: req.userId // Staff ID from token
      })
      .select('*, FoundItem(item_name), Person!claimer_id(full_name), User!created_by(full_name)')
      .single();

    if (error) throw error;

    // Update FoundItem status
    await supabase.from('FoundItem').update({ status }).eq('found_item_id', found_item_id);

    // If RETURNED, free up the locker if it was in one
    if (status === 'RETURNED' && item.locker_id) {
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

    let query = supabase
      .from('Claim')
      .select('*, FoundItem(item_name), Person!claimer_id(full_name, phone), User!created_by(full_name)')
      .order('claim_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: claims, error } = await query;
    if (error) throw error;

    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/claims/:id/return (Mark as RETURNED)
exports.markAsReturned = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: claim, error: claimError } = await supabase
      .from('Claim')
      .select('*, FoundItem(status, locker_id)')
      .eq('claim_id', id)
      .single();

    if (claimError || !claim) {
      return res.status(404).json({ message: 'Claim record not found' });
    }

    if (claim.status === 'RETURNED') {
      return res.status(400).json({ message: 'Claim is already marked as returned' });
    }

    const return_date = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('Claim')
      .update({ status: 'RETURNED', return_date })
      .eq('claim_id', id);

    if (updateError) throw updateError;

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

    const { data: claim, error: claimError } = await supabase
      .from('Claim')
      .select('*, FoundItem(status)')
      .eq('claim_id', id)
      .single();

    if (claimError || !claim) {
      return res.status(404).json({ message: 'Claim record not found' });
    }

    if (claim.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Claim is already cancelled' });
    }

    const { error } = await supabase
      .from('Claim')
      .update({ status: 'CANCELLED' })
      .eq('claim_id', id);

    if (error) throw error;

    // Revert FoundItem status to STORED if it was CLAIMED
    if (claim.FoundItem?.status === 'CLAIMED') {
        await supabase.from('FoundItem').update({ status: 'STORED' }).eq('found_item_id', claim.found_item_id);
    }

    res.status(200).json({ message: 'Claim cancelled successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

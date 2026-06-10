const supabase = require('../config/supabase');

// POST /api/claims (Submit a claim)
exports.createClaim = async (req, res) => {
  try {
    const { item_id, proof_description, proof_image_url } = req.body;

    if (!item_id) {
      return res.status(400).json({ message: 'Item ID is required' });
    }

    // Check if item exists and is active/stored
    const { data: item, error: findError } = await supabase
      .from('items')
      .select('status')
      .eq('id', item_id)
      .maybeSingle();

    if (findError || !item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status === 'claimed' || item.status === 'removed' || item.status === 'deleted') {
      return res.status(400).json({ message: 'Item is already claimed or unavailable' });
    }

    const { data: claim, error } = await supabase
      .from('claims')
      .insert({
        item_id,
        user_id: req.userId, // From auth token
        status: 'pending',
        proof_description,
        proof_image_url
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Claim request submitted successfully', claim });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/claims (Get all claims, with optional status filter) - Staff/Admin Only
exports.getClaims = async (req, res) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('claims')
      .select('*, items:item_id(name, category, place), users:user_id(username, email)')
      .order('created_at', { ascending: false });

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

// PUT /api/claims/:id/approve - Staff/Admin Only
exports.approveClaim = async (req, res) => {
  try {
    const { id } = req.params;

    // Get claim details to find associated item and claimer
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*, users:user_id(username)')
      .eq('id', id)
      .single();

    if (claimError || !claim) {
      return res.status(404).json({ message: 'Claim request not found' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({ message: `Claim is already ${claim.status}` });
    }

    // 1. Update the claim status to approved
    const { error: approveError } = await supabase
      .from('claims')
      .update({ status: 'approved' })
      .eq('id', id);

    if (approveError) throw approveError;

    // 2. Update the item status to claimed and record receiver details
    const receiverName = claim.users ? claim.users.username : 'Registered User';
    const { error: itemUpdateError } = await supabase
      .from('items')
      .update({
        status: 'claimed',
        receiver: receiverName
      })
      .eq('id', claim.item_id);

    if (itemUpdateError) throw itemUpdateError;

    // 3. Reject other pending claims for the same item automatically
    await supabase
      .from('claims')
      .update({ status: 'rejected' })
      .eq('item_id', claim.item_id)
      .eq('status', 'pending');

    res.status(200).json({ message: 'Claim approved successfully and item marked as claimed!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/claims/:id/reject - Staff/Admin Only
exports.rejectClaim = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('status')
      .eq('id', id)
      .single();

    if (claimError || !claim) {
      return res.status(404).json({ message: 'Claim request not found' });
    }

    if (claim.status !== 'pending') {
      return res.status(400).json({ message: `Claim is already ${claim.status}` });
    }

    const { error } = await supabase
      .from('claims')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ message: 'Claim request rejected successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

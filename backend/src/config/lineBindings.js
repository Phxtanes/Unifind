const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../uploads/line_bindings.json');

function loadBindings() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
      return {};
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '{}');
  } catch (error) {
    console.error('Error loading LINE bindings:', error);
    return {};
  }
}

function saveBindings(bindings) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(bindings, null, 2));
  } catch (error) {
    console.error('Error saving LINE bindings:', error);
  }
}

exports.bind = (email, lineUserId) => {
  const bindings = loadBindings();
  bindings[email.toLowerCase().trim()] = lineUserId;
  saveBindings(bindings);
};

exports.getLineUserId = (email) => {
  if (!email) return null;
  const bindings = loadBindings();
  return bindings[email.toLowerCase().trim()] || null;
};

exports.getEmailByLineUserId = (lineUserId) => {
  if (!lineUserId) return null;
  const bindings = loadBindings();
  for (const [email, id] of Object.entries(bindings)) {
    if (id === lineUserId) return email;
  }
  return null;
};

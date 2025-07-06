module.exports = (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.1' // Added version to trigger redeployment
  });
};
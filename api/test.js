module.exports = (req, res) => {
  res.status(200).json({
    message: 'API is working!',
    method: req.method,
    url: req.url,
    headers: req.headers
  });
};

function shallowCopy(src) {
  var dst = {};
  Object.keys(src).forEach(function(key) {
    dst[key] = src[key];
  });
  return dst;
}

export default{
	shallowCopy,
}
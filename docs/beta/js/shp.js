// Shapefile parser, following the specification at
// http://www.esri.com/library/whitepapers/pdfs/shapefile.pdf
SHP = {
  NULL: 0,
  POINT: 1,
  POLYLINE: 3,
  POLYGON: 5
};

SHP.getShapeName = function(id) {
  for (name in this) {
    if (id === this[name]) {
      return name;
    }
  }
};

SHPParser = function() {
};

SHPParser.load = function(src, callback, onerror) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', src);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function() {
//    console.log(xhr.response);
    var d = new SHPParser().parse(xhr.response,src);
    callback(d);
  };
  xhr.onerror = onerror;
  xhr.send(null);
};

SHPParser.loadlocal = function(file, callback, onerror) {
	let reader = new FileReader();
	reader.readAsArrayBuffer(file)
	reader.onload = function() {
		var d = new SHPParser().parse(reader.result,file);
		callback(d);
	};
	reader.onerror = onerror;
};


SHPParser.prototype.parse = function(arrayBuffer,src) {
  var o = {};
  var dv = new DataView(arrayBuffer);
  var idx = 0;
  o.fileName = src;
  o.fileCode = dv.getInt32(idx, false);
  if (o.fileCode != 0x0000270a) {
    throw (new Error("Unknown file code: " + o.fileCode));
  }
  idx += 6*4;
  o.wordLength = dv.getInt32(idx, false);
  o.byteLength = o.wordLength * 2;
  idx += 4;
  o.version = dv.getInt32(idx, true);
  idx += 4;
  o.shapeType = dv.getInt32(idx, true);
  idx += 4;
  o.minX = dv.getFloat64(idx, true);
  o.minY = dv.getFloat64(idx+8, true);
  o.maxX = dv.getFloat64(idx+16, true);
  o.maxY = dv.getFloat64(idx+24, true);
  o.minZ = dv.getFloat64(idx+32, true);
  o.maxZ = dv.getFloat64(idx+40, true);
  o.minM = dv.getFloat64(idx+48, true);
  o.maxM = dv.getFloat64(idx+56, true);
  idx += 8*8;
  o.records = [];
  while (idx < o.byteLength) {
    var record = {};
    record.number = dv.getInt32(idx, false);
    idx += 4;
    record.length = dv.getInt32(idx, false);
    idx += 4;
    try {
      record.shape = this.parseShape(dv, idx, record.length);
    } catch(e) {
      console.log(e, record);
    }
    idx += record.length * 2;
    o.records.push(record);
  }
  return o;
};

SHPParser.prototype.parseShape = function(dv, idx, length) {
  var i=0, c=null;
  var shape = {};
  shape.type = dv.getInt32(idx, true);
  idx += 4;
  var byteLen = length * 2;
  switch (shape.type) {
    case SHP.NULL: // Null
      break;

    case SHP.POINT: // Point (x,y)
      shape.content = {
        x: dv.getFloat64(idx, true),
        y: dv.getFloat64(idx+8, true)
      };
      break;
    case SHP.POLYLINE: // Polyline (MBR, partCount, pointCount, parts, points)
    case SHP.POLYGON: // Polygon (MBR, partCount, pointCount, parts, points)
      c = shape.content = {
        minX: dv.getFloat64(idx, true),
        minY: dv.getFloat64(idx+8, true),
        maxX: dv.getFloat64(idx+16, true),
        maxY: dv.getFloat64(idx+24, true),
        parts: new Int32Array(dv.getInt32(idx+32, true)),
        points: new Float64Array(dv.getInt32(idx+36, true)*2)
      };
      idx += 40;
      for (i=0; i<c.parts.length; i++) {
        c.parts[i] = dv.getInt32(idx, true);
        idx += 4;
      }
      for (i=0; i<c.points.length; i++) {
        c.points[i] = dv.getFloat64(idx, true);
        idx += 8;
      }
      break;

    case 8: // MultiPoint (MBR, pointCount, points)
    case 11: // PointZ (X, Y, Z, M)
    case 13: // PolylineZ
    case 15: // PolygonZ
    case 18: // MultiPointZ
    case 21: // PointM (X, Y, M)
    case 23: // PolylineM
    case 25: // PolygonM
    case 28: // MultiPointM
    case 31: // MultiPatch
      throw new Error("Shape type not supported: "
                      + shape.type + ':' +
                      + SHP.getShapeName(shape.type));
    default:
      throw new Error("Unknown shape type at " + (idx-4) + ': ' + shape.type);
  }
  return shape;
};

function extractBounds(shape){
	return [shape.content.minX, shape.content.maxX, shape.content.minY, shape.content.maxY]
	
}

function extractPolys(shape){
	var allPolys=[]
	var poly=[]
	var part = 0
	var newPath=true
	for(var i=0; i<shape.content.points.length/2; i++){
	//			coords=tpt(shape.content.points[i*2],shape.content.points[i*2+1])
		var xy=[shape.content.points[i*2], shape.content.points[i*2+1]]
		if(i==shape.content.parts[part+1]){
			part++
			allPolys.push(poly)
			poly=[]
		}
		poly.push(xy)
	}
	allPolys.push(poly)
	return allPolys
}


function shpLoadError() {
	window.console.log('shp file failed to load');
}



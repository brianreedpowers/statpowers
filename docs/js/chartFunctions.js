var ctx,h,w,box
var inset = 20
var X0, X1, Y0, Y1, CW, CH, CL, CT
var ramps=[[[0,0,0],[0,0,255],[255,0,255],[255,154,101],[255,255,0]],
	   [[69,4,87],[44,13,142],[78,195,107],[255,255,0]],
	   [[0,166,0],[99,198,0],[230,230,0],[234,182,78],[238,185,159],[242,242,242]],
	   [[128,253,255],[255,255,255],[255,128,255]],
	   [[255,255,255],[255,255,0],[253,156,0],[252,67,8],[255,0,0]],
	   [[140,12,37],[235,144,114],[247,247,247],[112,182,213],[18,74,134]]]
var xBounds = [-180,180], yBounds=[-90,90]
var xRender = [0,500], yRender=[0,500]

var chartParamsSet=false
var spatialPlotParameters = []
var lag = [];
var semi = [];
var semiN = [];

var circleGrid=[]
var circleGridRes=4
for(var i= -circleGridRes; i<=circleGridRes; i++){
	for(var j= -circleGridRes; j<=circleGridRes; j++){
		if(Math.sqrt(i*i+j*j)<=circleGridRes) circleGrid.push([i/circleGridRes, j/circleGridRes])
	}
}


function colorRamp(ramp, x){//x is a number between 0 and 1
	for(var i=0; i<ramps[ramp].length-1; i++){
		if(x>=i/(ramps[ramp].length-1) && x<= (i+1)/(ramps[ramp].length-1)){
			var alpha =  (x-i/(ramps[ramp].length-1))*(ramps[ramp].length-1)
//			console.log(x + " "+i+" " + alpha)
			var r=alpha*ramps[ramp][i+1][0]+(1-alpha)*ramps[ramp][i][0]
			var g=alpha*ramps[ramp][i+1][1]+(1-alpha)*ramps[ramp][i][1]
			var b=alpha*ramps[ramp][i+1][2]+(1-alpha)*ramps[ramp][i][2]
			return ('rgba('+r+','+g+','+b+',1)')
			break;
		}
	}		
}

function setChartParams(x0,x1,y0,y1,cw,ch,cl,ct){
	chartParamsSet=true
	X0=x0
	X1=x1
	Y0=y0
	Y1=y1
	CW=cw
	CH=ch
	CL=cl
	CT=ct
	xBounds=[X0,X1]
	yBounds=[Y0,Y1]
	xRender=[cl,cl+cw]
	yRender=[ct,ct+ch]
}
function tx(x){
//	console.log(x +" -> " +(x-X0)/(X1-X0)*CW+CL)
	return ((x-X0)/(X1-X0)*CW+CL)
}
function ty(y){
//	console.log(y +" -> " +(y-Y0)/(Y1-Y0)*CH+CT)
	return ((Y1-y)/(Y1-Y0)*CH+CT)
}

function untx(x){
	return ((x-spatialPlotParameters[6])/spatialPlotParameters[4] * (spatialPlotParameters[1]-spatialPlotParameters[0])+spatialPlotParameters[0])	
}

function unty(y){
	return (-((y-spatialPlotParameters[7])/spatialPlotParameters[5] * (spatialPlotParameters[3]-spatialPlotParameters[2])-spatialPlotParameters[3]))	
}


function rect(x1,y1,x2,y2){
	this.x1=x1
	this.x2=x2
	this.y1=y1
	this.y2=y2
}

function linTran(x0,xf,y0,yf) {
	// finds b and a for transforming from x to y
	r = new Array(2)
	r[1]=(yf-y0)/(xf-x0);
	r[0] = (yf+y0)/2- r[1] * (xf+x0)/2;
	return r
}

function init(canvasName) {
	canvas = document.getElementById(canvasName); 
	ctx = canvas.getContext('2d');
	ctx.fillStyle = "white";
	h = canvas.height 
	w = canvas.width
	var x1 = inset
	var x2 = x1+w - 2*inset
	var y1 = inset
	var y2 = y1+ h - 2*inset
	box = new rect(x1,y1,x2,y2)
}

var fontSizeTitle=14, fontSizeAxis=12

function drawL(ctx,x1,x2,y1,y2){
	ctx.beginPath();
	ctx.lineTo(x1,y1)
	ctx.moveTo(x1,y2)
	ctx.lineTo(x2,y2);
	ctx.stroke();	
}

function chartTitle(context, label, x,y, fsize=fontSizeTitle){
	context.beginPath();
	context.textAlign = "center";
	context.fillStyle = "black";
	context.font = fsize+"px sans-serif";
	context.textBaseline="top";
	context.fillText(label, x, y);
}

//Draw axis with tick marks and values
function drawXaxis(ctx, lMargin, tMargin, chartHeight, chartWidth, nBins, h, xMin, fsize=fontSizeAxis){
	//draw horizontal axis
	var y = chartHeight + tMargin
	ctx.fillStyle = "#000000";	
	ctx.strokeStyle = "#000000";
	ctx.lineWidth=Math.max(1,.75*fsize/12);
	ctx.font = fsize+"px sans-serif";
	ctx.beginPath();
	ctx.moveTo(0+lMargin,y +1);
	ctx.lineTo(lMargin+chartWidth,y +1);
	ctx.stroke();
	ctx.fillStyle = "black";
	var binPrecision=Math.max(0,Math.ceil(-Math.log10(h)))
	var step = 1
	var j=999999
	for (var i =0; i<=nBins; i++) {
		var labelNumber = xMin + (h*i)
		var numberWidth = Math.log10(2+Math.floor(Math.abs(xMin + (h*i))))+4+binPrecision*10
		if(xMin + (h*i)<0) numberWidth+=10
		step = Math.ceil(numberWidth/(chartWidth/nBins));
		j++;
		if(j>=step){
			j=0
			x=lMargin + (chartWidth/nBins)*i
			ctx.moveTo(x,y)
			ctx.lineTo(x,y+5)
			var xlab = (+xMin + (h*i) ).toFixed(binPrecision)
			ctx.fillText(xlab, x, y+15);
			ctx.stroke()
		}
	}
}

function chartAxisTicksX(ctx, y, x0, x1, nTicks, lbl0, lbl1, fsize=fontSizeAxis){
	ctx.font = fsize+"px sans-serif";
	ctx.textAlign="center"
	ctx.textBaseline="top";
	ctx.strokeStyle="black"
	ctx.fillStyle="black"
	var prec = Math.round(Math.log10(lbl1-lbl0)+1)
	for( var i=0; i<nTicks; i++){
		var x = x0+(x1-x0)/(nTicks-1)*i
		var xlab = lbl0+i*(+lbl1-lbl0)/(nTicks-1)
		xlab=fixed(xlab,prec)
		ctx.beginPath()
		ctx.moveTo(x,y)
		ctx.lineTo(x,y+5)		
		ctx.fillText(xlab, x, y+7);
		ctx.fill()
		ctx.stroke()
		
	}	
}

function chartAxisX(context,y,x0,x1,labelStart,labelEnd,ticks,axisLabel="",skipTicks=false,xVals=[], fsize=fontSizeAxis, displayAll=false){
	
//	console.log(xVals)
	//Horizontal Axis
	context.lineWidth=Math.max(1,.75*fsize/12);
	context.beginPath();
	context.strokeStyle = "black";
	context.moveTo(x0,y)
	context.lineTo(x1,y)
	context.stroke();

	context.font = fsize+"px sans-serif";
	context.textAlign = "center";
	context.fillStyle = "black";
	context.textBaseline="top";
	var tickPrecision = Math.max(0,1+Math.ceil(-Math.log((labelEnd-labelStart)/(ticks-1))))
	var xStart=0
	if(xVals.length>0){
		ticks=xVals.length-1
	}	
	var tickMod=1
	if(ticks>30) {
		tickMod = Math.ceil(ticks/30)
		skipTicks=true
	}
	var maxWidth = (x1-x0)/(ticks)*.95
//	console.log(maxWidth)
//	console.log(xVals)
	var tickSize = 4*fsize/12
	for (var i=0; i<=ticks; i++){
		if(skipTicks&& (i%tickMod==0) || !skipTicks){
			x=Math.round((x1-x0)*(i/ticks)+x0)
			context.beginPath();
			context.font = fsize+"px sans-serif";
			context.moveTo(x,y)
			context.lineTo(x,y+tickSize)
			var xlab=(xVals.length==0?parseFloat((labelStart + i*(labelEnd-labelStart)/ticks).toFixed(Math.min(2,tickPrecision)) ):xVals[i])
			var labelWidth=context.measureText(xlab).width
//			console.log(xlab + " " +labelWidth)
			var xStartNew = x-labelWidth/2-2
			if(xStartNew>xStart && !displayAll){
				context.fillText(xlab, x, y+tickSize*1.5);
				xStart = x+ labelWidth/2 +2
			} else if (displayAll){
				context.font = fsize*Math.min(maxWidth/labelWidth,1)+"px sans-serif";
				context.fillText(xlab, x, y+tickSize*1.5);

			}				
			context.stroke();
			context.fill();
		}
	}
	
	context.fillText(axisLabel, (x0+x1)/2, y+fsize*1.6);
	//context.stroke();
}

function chartAxisY(context,x,y0,y1,labelStart,labelEnd,ticks,axisLabel="",lines=false,x2=500, clearLabel=true, fsize=fontSizeAxis, mirror=false){
	//Vertical Axis
	context.lineWidth=Math.max(1,.75*fsize/12);
	context.beginPath();
	context.strokeStyle = "black";
	context.moveTo(x,y0)
	context.lineTo(x,y1)
	context.stroke();

	context.font = fsize+"px sans-serif";
	context.textAlign = "right";
	context.fillStyle = "black";
	context.textBaseline="middle";
	var tickPrecision = Math.max(0,1+Math.ceil(-Math.log((labelEnd-labelStart)/(ticks-1))))
	var yStart=0
	
	context.strokeStyle = "#DDD"
	context.beginPath()
	for (var i=0; i<=ticks && lines; i++){
		y=Math.round(y1*(i/ticks) + y0*(ticks-i)/ticks)
		context.moveTo(x,y)
		context.lineTo(x2,y)	
	}
	context.stroke();
	
	var range = (labelEnd-labelStart)/ticks
	var rangeMagnitude = Math.floor(Math.log10(range))  //we can truncate precision after this place
//	console.log("between ticks: "+range)
//	console.log("precision ="+ rangeMagnitude)
	var cutoff=0
	var append=""
	if(rangeMagnitude>=3) {
		cutoff=3
		append="K"
	}
	if(rangeMagnitude>=6){
		cutoff=6
		append="M"
	}
	if(rangeMagnitude>=9){
		cutoff=9
		append="B"
	}
	if(rangeMagnitude>=12){
		cutoff=12
		append="T"
	}
	if(rangeMagnitude>=15){
		cutoff=15
		append="T"
	}

	
	context.strokeStyle = "black"
	if(mirror) context.textAlign="left"
	for (var i=0; i<=ticks; i++){
		y=Math.round(y1*(i/ticks) + y0*(ticks-i)/ticks)
		context.beginPath();
		context.moveTo(x,y)
		context.lineTo(x-4*(mirror?-1:1),y)
		context.stroke();

		var xlab=parseFloat((labelStart + i*(labelEnd-labelStart)/ticks).toFixed(Math.min(2,tickPrecision)) )
		if(cutoff>0){
//			console.log(xlab)
			xlab=Math.round(xlab/Math.pow(10,cutoff),1)+append
//			console.log("becomes "+xlab)
		}
		context.fillText(xlab, x-6*(mirror?-1:1), y);
		
	}

	chartAxisLabelsY(context,[axisLabel],x-40*(mirror?-1:1)*fsize/12,y0,y1-y0,true,fsize)
	
}

function chartAxisLabelsY(ctx,labelArray,x,tMargin,eachPlotHeight, black=false, fsize=fontSizeAxis, vertical=true){
	ctx.textBaseline="middle";
	ctx.textAlign = "center";
	ctx.font = fsize+"px  sans-serif"
	if(labelArray.length==1) black=true;
	var stagger = (labelArray.length>5?true:false);
	var offset = 0;
	
//	for(var i=0; i<labelArray.length; i++){
//	}
	for(var i=0; i<labelArray.length; i++){
		ctx.beginPath()
//		ctx.strokeStyle=colors[i];
		ctx.save();
		ctx.translate(x, tMargin+eachPlotHeight*(i+.5));
		ctx.rotate(-Math.PI/2);


		var textWidth=ctx.measureText(" "+labelArray[i]+" ").width;
		var textHeight = fsize*1.286
		ctx.beginPath()
		ctx.fillStyle=(black?"white":"rgba("+hexToRgb(colorHexes[i]).r +","+hexToRgb(colorHexes[i]).g +","+hexToRgb(colorHexes[i]).b +",.2)");
		ctx.fillRect(-textWidth/2, -textHeight/2,textWidth,textHeight)
		ctx.fill()				
	

		ctx.fillStyle='black'
		ctx.fillText(labelArray[i], 0, offset);
		ctx.restore();
		if(stagger) offset = 15-offset;
	}
}

function chartGroupLabels(ctx, labelArray, x,y,gap,black=true, fsize=fontSizeAxis){
	ctx.textBaseline="bottom";
	ctx.textAlign = "left";
	ctx.font = fsize+"px  sans-serif"
	if(labelArray.length==1) black=true;
	for(var i=0; i<labelArray.length; i++){
//		ctx.strokeStyle=colors[i];

		var textWidth=ctx.measureText(" "+labelArray[i]+" ").width;
		var textHeight = fsize*1.286
		var cHex = colorHexes[labelColors[i]]
		ctx.beginPath()
		ctx.fillStyle=(black?"rgba(255,255,255,.5)":"rgba("+hexToRgb(cHex).r +","+hexToRgb(cHex).g +","+hexToRgb(cHex).b +",.2)");
		ctx.fillRect(x, y+gap*i+2*fsize/12,textWidth,-textHeight)

		ctx.fillStyle='black'
		ctx.fillText(" "+labelArray[i], x, y+gap*i);
		ctx.fill()				
	}
	
	
}

function drawDot(ctx, hiddenCTX, x,y,r){
	ctx.beginPath();
	ctx.arc(x,y, r, 0, 2 * Math.PI);
	ctx.fill();	
	hiddenCTX.beginPath();
	hiddenCTX.arc(x,y, r*2.25, 0, 2 * Math.PI);
	hiddenCTX.fill();
}

function isClearSpot(ctx,x,y){
	var p=ctx.getImageData(x,y,1,1).data;
	return (p[0]+p[1]+p[2]>700);
}

function clearCanvas(ctx,w,h){
	ctx.fillStyle = "white";
	ctx.beginPath();
	ctx.fillRect(0, 0, w, h);
	ctx.fill();
}

function downloadCanvas(link, canvasId, filename) {
    link.href = document.getElementById(canvasId).toDataURL();
    link.download = filename;
}

function makeLegend(ctx,x, y,names, bg="white", symb="lines",topRight=true, fsize=fontSizeAxis,title=""){
	var longestTextLength = 0
	ctx.font = fsize+"px  sans-serif"
	var scale=fsize/12
	
	for(var i=0; i<names.length; i++){
		longestTextLength = Math.max(longestTextLength, ctx.measureText(names[i]).width)
		//console.log(names[i]+" length: "+ctx.measureText(names[i]).width)
	}
	if(title!="") longestTextLength = Math.max(longestTextLength, ctx.measureText(title).width)
//	var cor=jStat.corrcoeff(Xdata,Ydata)
	var legendX=x-longestTextLength-25
	var legendY=5+y
	if(!topRight) legendY=y-5-names.length*15*(fsize/12)
	//console.log(legendX+","+legendY)

	var legendWidth = longestTextLength+2.4*fsize
	ctx.beginPath()
	ctx.fillStyle=bg
	ctx.strokeStyle="black"
	ctx.fillRect(legendX-10*(fsize/12),legendY-10*(fsize/12),legendWidth,5+(names.length+(title==""?0:1))*15*(fsize/12))
	ctx.rect(legendX-10*(fsize/12),legendY-10*(fsize/12),legendWidth,5+(names.length+(title==""?0:1))*15*(fsize/12))
	ctx.fill()
	ctx.stroke()
	
	ctx.textBaseline="middle";
	if(title!=""){
		ctx.beginPath();
		ctx.fillStyle="black"
		ctx.textAlign="center"
		ctx.fillText(title,legendX+longestTextLength/2, legendY)
		ctx.fill()
	}
	
	ctx.textAlign="left"
	for(var i=0; i<names.length; i++){
		var labelY = legendY+15*(i+(title==""?0:1))*(fsize/12)
		ctx.beginPath();
		var cHex = colorHexes[labelColors[i]]
		if(symb=="dots"){
			ctx.fillStyle = "rgba("+hexToRgb(cHex).r +","+hexToRgb(cHex).g +","+hexToRgb(cHex).b +",.3)";
			ctx.arc(legendX,labelY, 5*scale, 0, 2 * Math.PI);
			ctx.fill();
		} else if (symb=="lines"){
			ctx.strokeStyle = "rgba("+hexToRgb(cHex).r +","+hexToRgb(cHex).g +","+hexToRgb(cHex).b +",1)";
			ctx.lineWidth=2*(fsize/12)		
			ctx.moveTo(legendX-5,labelY)
			ctx.lineTo(legendX+8,labelY)
			ctx.stroke();
		} else if (symb=="squares"){
			ctx.fillStyle = "rgba("+hexToRgb(cHex).r +","+hexToRgb(cHex).g +","+hexToRgb(cHex).b +",1)";
			ctx.fillRect(legendX-7*scale, labelY-fsize/2, fsize, fsize)
			ctx.fill()
		}
		ctx.beginPath();
		ctx.fillStyle="black"
		ctx.fillText(names[i], legendX+fsize*.6, labelY);
		ctx.fill()
	}
	return legendWidth
}

function tpt(x,y){
	return([tx(x),ty(y)]);
}

function drawX(pt, ctx, size=10, colors){
	size *= .5
	var incr = (size/10)/Math.sqrt(2)
	for(var i=colors.length-1; i>=0; i--){	
		ctx.beginPath()
		ctx.lineWidth = (2 + 1*i)*size/5
		ctx.strokeStyle = colors[i]
		var xd=size+i*incr
		ctx.moveTo(tx(pt[0])-xd,ty(pt[1])-xd)
		ctx.lineTo(tx(pt[0])+xd,ty(pt[1])+xd)
		ctx.moveTo(tx(pt[0])+xd,ty(pt[1])-xd)
		ctx.lineTo(tx(pt[0])-xd,ty(pt[1])+xd)
		ctx.stroke()
	
	}
}

function drawHorizArrow(ctx, x1, x2, y, sz){
	ctx.beginPath()
	ctx.moveTo(x1,y)
	ctx.lineTo(x2,y)
	ctx.moveTo(x1+sz,y-sz)
	ctx.lineTo(x1,y)
	ctx.lineTo(x1+sz,y+sz)
	ctx.moveTo(x2-sz,y-sz)
	ctx.lineTo(x2,y)
	ctx.lineTo(x2-sz,y+sz)
	ctx.stroke()
	
}

//-----------------------------------------------------
//           QQ PLOT
//-----------------------------------------------------

function refreshNormalityPlot(data, forceIt=false, canvas='qqPlot', dataName=document.getElementById('name1').value, varUnits=document.getElementById('varUnits1').value, varName=exists('varName1')?document.getElementById('varName1').value:""){
	if (!forceIt && !isOpen("headerNormality")) return false;
	var drawBands = (exists("qqbands") && document.getElementById('qqbands').checked)
	var wormPlot = (exists("wormPlot") && document.getElementById('wormPlot').checked)
	data.sort(function(a, b){return a-b})
	var xBar = jStat.mean(data)
	var s = jStat.stdev(data,true)
	var n = data.length
	//console.log(data)
	//console.log(n)
	var c=document.getElementById(canvas)
	var ctx=c.getContext("2d")
	ctx.save();
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);	
	var scale = c.width/480
	ctx.lineWidth=Math.max(1,.75*scale);
	var lMargin=50*scale
	var rMargin=10*scale
	var tMargin=20*scale
	var bMargin=35*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	
	var qXmin = jStat.normal.inv((.625)/(n+.25),0,1)-.1
	var qXmax = jStat.normal.inv((n-1+.625)/(n+.25),0,1)+.1
	var qXrange = qXmax-qXmin
	var qYmin = (data[0] - xBar)/s
	var qYmax = (data[n-1] - xBar)/s
	var qYrange = qYmax - qYmin
	var yMin=data[0]-.1*s
	var yMax=data[n-1]+.1*s
	var fns=fiveNumSum(data)
	var minQuant = Math.min(qXmin,qYmin)
	var maxQuant = Math.max(qXmax,qYmax)
	var IQR = fns[3]-fns[1]
	var robust_s=IQR/1.349
	var yMid=(fns[1]+fns[3])/2

	ctx.beginPath();
	ctx.rect(lMargin,tMargin,chartWidth,chartHeight)
	ctx.clip();
	if(drawBands){
		yMin=yMid+robust_s*qXmin - 1.96 * (robust_s * se_z(qXmin,n))
		yMax=yMid+robust_s*qXmax + 1.96 * (robust_s * se_z(qXmax,n))		
	}
	if(wormPlot){
		yMin= Math.min(- 1.96 * (se_z(qXmin,n)),((data[0]-(robust_s * qXmin))-yMid)/robust_s)
		yMax= Math.max(1.96 * (se_z(qXmax,n)) ,((data[n-1]-(robust_s * qXmax))-yMid)/robust_s)	
	}

	setChartParams(qXmin,qXmax,yMin,yMax,chartWidth,chartHeight,lMargin,tMargin)

	ctx.strokeStyle = "black";
	for(var i=0; i<n; i++){
		var qX = jStat.normal.inv((i+.625)/(n+.25),0,1)
		ctx.beginPath();
		var pY=data[i]
		if(wormPlot){
			pY = ((pY-(robust_s * qX))-yMid)/robust_s
		}
		ctx.arc(tx(qX),ty(pY), 2*scale, 0, 2 * Math.PI);
		ctx.fillStyle = "#000000";
		ctx.fill();
		ctx.stroke();
	}

	
	if(drawBands || wormPlot){
		ctx.strokeStyle = "blue";
		ctx.fillStyle="rgba(0,0,255,.1)"
		ctx.beginPath();
		for(var pm=-1; pm<=1; pm+=2){
			for(var z=qXmin; z<=qXmax+.1; z+=.1){
				var Z=(pm==-1?z:qXmax-(z-qXmin))
				var se =  robust_s * se_z(Z,n)
				var xLine = yMid + robust_s * Z
				var pY=(wormPlot?pm*se_z(Z,n)*1.96 :xLine+pm*1.96*se)
				if(z==qXmin && pm==-1){
					ctx.moveTo(tx(Z),ty(pY))
				} else {
					ctx.lineTo(tx(Z),ty(pY))
				}
			}
		}
			ctx.stroke();
			ctx.fill();
	}

/*	ctx.strokeStyle = "red";
	ctx.beginPath();
	ctx.moveTo(tx(qXmin),ty(wormPlot?0:median+qXmin*robust_s));
	ctx.lineTo(tx(qXmax),ty(wormPlot?0:median+qXmax*robust_s));
	ctx.stroke();
	*/
	ctx.strokeStyle = "red";
	ctx.beginPath();
	
	var slope = (ty(fns[3])-ty(fns[1]))/(tx(jStat.normal.inv(.75,0,1))-tx(jStat.normal.inv(.25,0,1)))
	
	ctx.moveTo(tx(jStat.normal.inv(.25,0,1))-250*scale,(wormPlot?ty(0):(ty(fns[1])-250*slope*scale)));
	ctx.lineTo(tx(jStat.normal.inv(.75,0,1))+250*scale,(wormPlot?ty(0):(ty(fns[3])+250*slope*scale)));
	ctx.stroke();

//console.log(	tx(jStat.normal.inv(.25,0,1)) + " , " + ty(wormPlot?0:fns[1]) )
//console.log(	tx(jStat.normal.inv(.75,0,1)) + " , " + ty(wormPlot?0:fns[3]) )
	
	
	
	ctx.restore();

	var lbl0 = Math.ceil(Math.max(-5,qXmin))
	var lbl1 = Math.floor(Math.min(5, qXmax))
	var x0 = (lbl0-qXmin)/qXrange*chartWidth+lMargin
	var x1 = (lbl1-qXmin)/qXrange*chartWidth+lMargin
	var nTicksY = 6

	chartTitle(ctx,dataName+" "+(wormPlot?'Worm Plot':'Q-Q Plot'),lMargin+.5*chartWidth, 0, fontSizeTitle*scale);
	chartAxisX(ctx,chartHeight+tMargin,lMargin,lMargin+chartWidth,jStat.min(data),jStat.max(data),0,'Theoretical Quantile',true,[],fontSizeAxis*scale)		
	chartAxisTicksX(ctx,chartHeight+tMargin,x0,x1,(lbl1-lbl0)+1,lbl0,lbl1,fontSizeAxis*scale)
	chartAxisY(ctx,lMargin,tMargin+chartHeight,tMargin,yMin,yMax,nTicksY,varName+" "+(varUnits!=""?"("+varUnits+") ":"")+(wormPlot?"Deviation":"Data Value"),false,lMargin+chartWidth,true,fontSizeAxis*scale)
}

function se_z(z,n){
	return Math.sqrt(jStat.normal.cdf(z,0,1) * (1- jStat.normal.cdf(z,0,1))/n) / jStat.normal.pdf(z,0,1)
}

//-----------------------------------------------------
//          PROBABILITY DENSITY PLOTS
//-----------------------------------------------------

function drawEmpiricalLines(ctx,a,b){
	canvas = document.getElementById("normal"); 
	h = canvas.height 
	w = canvas.width
	var scale=w/490
	var lMargin=30*scale, rMargin=30*scale, tMargin=20*scale, bMargin=30*scale
	var maxDensity = maximumDensity(a,b)
	var chartWidth = w-rMargin-lMargin
	var chartHeight = h-tMargin-bMargin
	var Xbounds=bounds(a,b)
	var lowX =  Xbounds[0]
	var highX = Xbounds[1]

	setChartParams(lowX,highX,0, maxDensity,chartWidth,chartHeight,lMargin,tMargin)

	var inc = (highX-lowX)/500
	ctx.lineWidth=Math.max(1,.75*scale);

	for(var i=-3; i<=3; i++){
		xx = a+i*b
//		xp = bx*xx +Ax
		d  = density( xx,a,b)
//		dp = by*d+Ay
		ctx.beginPath();
		ctx.setLineDash([5,0]);
		ctx.moveTo(tx(i),ty(0))
		ctx.lineTo(tx(i),ty(d)) 
		ctx.stroke();
		if(i!=0){
			ctx.beginPath();
			ctx.setLineDash([5, 3]);
			ctx.moveTo(tx(i),ty(d))
			ctx.lineTo(tx(i),(55+Math.abs(i)*20)*scale)
			ctx.stroke()
		}
	}
	var percs = [2.35, 13.5, 34, 34, 13.5, 2.35]
	ctx.font = (12*scale)+"px sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline="middle";
	for(var i=0; i<percs.length; i++){
		ctx.fillStyle="white"
		ctx.fillText(percs[i]+"%", tx(lowX+(i+1)/7*(highX-lowX))-1, ty(0)-35*scale+1);
		ctx.fillStyle="black"
		ctx.fillText(percs[i]+"%", tx(lowX+(i+1)/7*(highX-lowX)), ty(0)-35*scale);
	}
	
	var percs = [68, 95, 99.7]
	ctx.setLineDash([5,0]);
	for(var i=0; i<percs.length; i++){
		drawHorizArrow(ctx,tx(-i-1), tx(i+1),(75+i*20)*scale,4*scale)
		ctx.beginPath()
		ctx.fillStyle="white"
		ctx.fillRect(tx((lowX+highX)/2)-15*scale-(i==2?5:0)*scale, scale*(74+i*20-8),scale*(30+(i==2?10:0)),16*scale)
//		ctx.fillText(percs[i]+"%", (xf+x0)/2-1, 80+i*20+1);
		ctx.fillStyle="black"
		ctx.fillText(percs[i]+"%", tx((lowX+highX)/2), (75+i*20)*scale);
	}	
}

function drawDensity(a,b,lFill,hFill, tail, shift=0, vscale=1, skipTicks=false, canvasID="densityFunction",renderPDF=true) {
	canvas = document.getElementById(canvasID); 
	ctx = canvas.getContext('2d');
	ctx.fillStyle = "white";
	h = canvas.height 
	w = canvas.width
	var scale=w/490
	var lMargin=30*scale, rMargin=30*scale, tMargin=20*scale, bMargin=30*scale

	ctx.beginPath()
	ctx.fillRect(0,0,w,h)
	ctx.fill()
	


//	console.log(a+","+b)
	var chartWidth = w-rMargin-lMargin
	var chartHeight = h-tMargin-bMargin
	var Xbounds=bounds(a,b)
	var maxDensity = maximumDensity(a,b)
	var lowX =  Xbounds[0]
	var highX = Xbounds[1]
	
	setChartParams(lowX,highX,0, maxDensity,chartWidth,chartHeight,lMargin,tMargin)
	
	var inc = (highX-lowX)/500

	ctx.lineWidth=Math.max(1,.75*scale);

if(renderPDF){
	//First draw fill
	ctx.beginPath();
	if (document.getElementById("colorful").checked==true)
		ctx.fillStyle = colorHex;
	else
		ctx.fillStyle = "#C0C0C0";
	ctx.moveTo(tx(lowX),ty(0))
	var filling=(tail?true:false), wasFilling=false;
//	console.log(lowX +  " " +highX + " by "+inc)
	for (var i=lowX;i<=highX;i+=inc){
		wasFilling=filling;
//		var xpPrev = bx*(i-inc) +Ax
//   		xp=bx*i +Ax		
		d =  density(i,a,b)
//		console.log(ty(d))
//		dp= by*d+Ay
		filling = (tail && (i>=hFill || i <= lFill))||(!tail && i<=hFill && i >=lFill)
		
		if(filling==true&&wasFilling==false){
			ctx.beginPath();
			ctx.moveTo(tx(i),ty(0)-1)
		}
		if(filling==true){
			ctx.lineTo(tx(i), ty(d))
		}	
		if(filling==false&&wasFilling==true || (filling==true && i+inc>=highX)){
			ctx.lineTo(tx(i),ty(0)-1)
			ctx.fill();
			ctx.moveTo(tx(i),ty(0)-1)
		}
	}
	
	//Next Draw line
	ctx.beginPath();
	ctx.moveTo(tx(lowX),ty(0))
	for (var i=lowX;i<=highX;i+=inc*1){
//  		xp=bx*i +Ax
		d =  density( i,a,b)
//		dp= by*d+Ay
		ctx.lineTo(tx(i),ty(d)) 
	}	
	ctx.lineTo(tx(highX),ty(density(highX,a,b)))
	ctx.lineTo(tx(highX),ty(0));
	ctx.stroke();
} else {
		setChartParams(lowX,highX,0, 1,chartWidth,chartHeight,lMargin,tMargin)
	chartAxisY(ctx,lMargin,chartHeight+tMargin+1,tMargin,0,1,10,"Cumulative Probability",true,lMargin+chartWidth, true, fontSizeAxis*scale)
	ctx.beginPath();
	ctx.moveTo(tx(lowX),ty(0))
	for (var i=lowX;i<=highX;i+=inc*1){
//  		xp=bx*i +Ax
		d =  cdf( i,a,b)
//		dp= by*d+Ay
		ctx.lineTo(tx(i),ty(d)) 
	}
	ctx.lineTo(tx(highX),ty(1));
	
	if(lFill>lowX){
	ctx.moveTo(tx(lFill), ty(0))
	ctx.lineTo(tx(lFill), ty(cdf(lFill,a,b)))
	ctx.lineTo(lMargin, ty(cdf(lFill,a,b)))
	}
	if(hFill<highX){
	ctx.moveTo(tx(hFill), ty(0))
	ctx.lineTo(tx(hFill), ty(cdf(hFill,a,b)))
	ctx.lineTo(lMargin, ty(cdf(hFill,a,b)))
	}
	
	ctx.stroke();
	
}

	var nTicks = (distribution=='Gaussian' || distribution=='T'?14:10)
	chartAxisX(ctx,tMargin+chartHeight,lMargin,lMargin+chartWidth,(lowX*vscale+shift),(highX*vscale+shift),nTicks,"",skipTicks,[],fontSizeAxis*scale)
//	chartTitle(ctx,(nSamples==1?dataName+" ":"")+"Empirical CDF", lMargin+.5*chartWidth, 0, fontSizeTitle*scale);
}

function inferenceVisual(divID, distr, a,b,Xshift,scale,lB,uB,testStat,lBLabel,uBLabel,testStatLabel,displayTestStat,fillTails){
//	console.log(a)
	var currentClass="canvasdivTiny"
	if(exists(divID+"VisContainer")){
		currentClass=document.getElementById(divID+"VisContainer").className
	}
//	(exists(divID)?document.getElementById(divID).parentElement.className:"canvasdivTiny")
//	console.log(currentClass)
//	if(currentClass=="") currentClass=
	
	outputString = "<div id=\""+divID+"VisContainer\" class=\""+currentClass+"\" onClick=\"toggleCanvas(this);\">"
	outputString +="			<canvas id=\""+divID+"Vis\" width=\"485\" height=\"300\">"
	outputString +="				<p>Your browser doesn't support canvas. Please update your browser.</p>"
	outputString +="			</canvas>"
	outputString +="			<a class=\"downloadButton topright\" href=\"\" onClick=\"downloadCanvas(this,'"+divID+"Vis','"+divID+"Visual.png');\"></a></div>"
	document.getElementById(divID).innerHTML=outputString;


//			alert(Xshift)
	distribution=distr
	var c=document.getElementById(divID+"Vis")
	var ctx=c.getContext("2d")
	ctx.beginPath();
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	ctx.fill();
	ctx.closePath();
	var maxDensity=0
	var Xbounds=[]
	var probDensity=[]
	var xEmpBins=50
	if(distribution=='empirical'){
		a = sortArray(a)
//		console.log(a)
//console.log(Xshift)
//console.log(scale)
//console.log(a[0])
		Xbounds[0] =  a[0]
		Xbounds[1] =  a[a.length-1]
		for(var i=0; i<xEmpBins; i++){
			probDensity[i]=0
		}
		for(var i=0; i<a.length; i++){
			probDensity[Math.floor((a[i]-Xbounds[0])/(Xbounds[1]-Xbounds[0]+1)*xEmpBins)]++
		}		
		for(var i=0; i<probDensity.length; i++)maxDensity=Math.max(maxDensity, probDensity[i])
//		console.log(probDensity)
	} else {
		maxDensity = maximumDensity(a,b)
		Xbounds=bounds(a,b)
	}
	
	var lMargin = 40
	var rMargin = 40
	var tMargin = 20
	var bMargin = 20
	
	var x0 = lMargin
	var xf = c.width-rMargin
	var inc = (Xbounds[1]-Xbounds[0])/(xf-x0)
	var Ay = c.height-bMargin
	
	lB = (lB-Xshift)/scale
	uB = (uB-Xshift)/scale

	ctx.lineWidth=1;
	//First draw fill
	ctx.beginPath();
	if (document.getElementById("colorful").checked==true)
		ctx.fillStyle = colorHexLite;
	else
		ctx.fillStyle = "#C0C0C0";
//	console.log(ctx.fillStyle)
	ctx.moveTo(x0,Ay)

	var i=Xbounds[0]
	var filling=(i<lB);
	if(!fillTails) filling=!filling
	var wasFilling=false;
//	if(tail) filling=true;
	for(;i<=Xbounds[1]; i+=inc){
		wasFilling=filling;
		xp=(i-Xbounds[0])/inc + lMargin
		var d=0
		if(distribution=="empirical"){
			d=probDensity[Math.floor((i-Xbounds[0])/(Xbounds[1]-Xbounds[0]+1)*probDensity.length)]	
		}else {
			d =  density( i,a,b)
		}
		dp= -d/maxDensity*(c.height-tMargin-bMargin)+Ay
		filling = (i<=lB || i>=uB)
		if(!fillTails) filling=!filling
		if(filling==true&&wasFilling==false){
			ctx.beginPath();
			ctx.moveTo(xp,Ay-1)
		}
		if(filling==true){
			ctx.lineTo(xp,dp)
		}	
		if(filling==false&&wasFilling==true || (filling==true && i+inc>=Xbounds[1])){
			ctx.lineTo(xp-1,Ay-1)
			ctx.fill();
			ctx.moveTo(xp,Ay-1)
		}
	}
	
	//Next Draw line
	ctx.beginPath();
	ctx.moveTo(x0,Ay)
	for (var i=Xbounds[0];i<=Xbounds[1];i+=inc*1){
		xp=(i-Xbounds[0])/inc + lMargin
		var d=0
		if(distribution=="empirical"){
			d=probDensity[Math.floor((i-Xbounds[0])/(Xbounds[1]-Xbounds[0]+1)*probDensity.length)]	
		}else {
			d =  density( i,a,b)
		}
		dp= -d/maxDensity*(c.height-tMargin-bMargin)+Ay
		ctx.lineTo(xp,dp) 
	}	
//	ctx.lineTo(xf,-density(Xbounds[1],a,b)/maxDensity*(c.height-tMargin-bMargin)+Ay)
	ctx.lineTo(xf,Ay);
	ctx.stroke();
		
	ctx.font = "12px sans-serif";
	ctx.textAlign = "center";
	ctx.fillStyle = "black";
	ctx.textBaseline="bottom"; 
	var x=0
	var xLab = ''
	var displayLine = true;
	for(var i=0; i<3;i++){
		if(i==0) {x=lB; xLab=lBLabel; displayLine = lB>Xbounds[0]}
		if(i==1) {x=uB; xLab=uBLabel; displayLine = uB<Xbounds[1]}
		if(i==2) {
			if(testStat<Xbounds[0]) testStat = Xbounds[0] - (Xbounds[1]-Xbounds[0])/15
			if(testStat>Xbounds[1]) testStat = Xbounds[1] + (Xbounds[1]-Xbounds[0])/15
			x=testStat; xLab=testStatLabel; displayLine = displayTestStat}
		
			if(displayLine){
				xp = (x-Xbounds[0])/inc + lMargin
				var d=0
				if(distribution=="empirical"){
					d=probDensity[Math.floor((x-Xbounds[0])/(Xbounds[1]-Xbounds[0]+1)*probDensity.length)]	
				}else {
					d =  density( x,a,b)
				}
				dp= -d/maxDensity*(c.height-tMargin-bMargin)+Ay
				ctx.moveTo(xp,Ay)
				ctx.lineTo(xp,dp-5)
				ctx.fillText(xLab,xp,dp-6)
				ctx.stroke()
		}
	}
	chartAxisX(ctx,Ay,x0,xf,Xbounds[0]*scale+Xshift, Xbounds[1]*scale+Xshift,10)
}

function drawProbabilityFunction(lFill,hFill, tail,canvasID) {
	canvas = document.getElementById(canvasID); 
	ctx = canvas.getContext('2d');
	ctx.fillStyle = "white";
	h = canvas.height 
	w = canvas.width
	var scale=w/490
	var lMargin=50*scale, rMargin=15*scale, tMargin=10*scale, bMargin=25*scale

	ctx.beginPath()
	ctx.fillRect(0,0,w,h)
	ctx.fill()
	
	var chartHeight=h-tMargin-bMargin
	var chartWidth = w-lMargin-rMargin
	var Xbounds=bounds()
	var n=Xbounds[1]-Xbounds[0]+1
	var barWidth = chartWidth/(n)
	var maxDensity = maximumProbability()
//	console.log(maxDensity)

	var ticks=Xbounds[1]-Xbounds[0]
//	console.log('drawPRobFunctio')
//	console.log(distribution + " " +c)
	var xAdj=(distribution=='negativebinomial' && c=='1' ? a : 0)
	chartAxisY(ctx,lMargin,tMargin+chartHeight,tMargin,0,maxDensity,8,"Probability",true,lMargin+chartWidth, true, fontSizeAxis*scale)
	chartAxisX(ctx,chartHeight+tMargin+1,lMargin+barWidth/2,lMargin+chartWidth-barWidth/2,Xbounds[0]+xAdj,Xbounds[1]+xAdj,ticks,"",false,[], fontSizeAxis*scale)


	ctx.beginPath()
	ctx.fillStyle = "black";
	var fillColor = (document.getElementById("colorful").checked==true ? colorHex : "#C0C0C0")
	var step = maxDensity/10;
	var sigPlaces = -Math.round(1.9*(Math.log10(step)))
	var onesPlace = Math.floor(sigPlaces/2)
	var fives = sigPlaces%2
	var step = Math.pow(10,-onesPlace) -fives/(2*Math.pow(10,onesPlace))

//	console.log(Xbounds[1])
	var wasFilling=0; filling=(tail && Xbounds[0]<=lFill || !tail && Xbounds[0]>=lFill)
	if(Xbounds[1]-Xbounds[0]>100){
		ctx.moveTo(lMargin, chartHeight+tMargin)
		ctx.fillStyle = (filling?fillColor:"white")
		for (var i=Xbounds[0];i<=Xbounds[1];i++){
		var barHeight = -pmf(i)/maxDensity*chartHeight
		wasFilling=filling
		filling=(tail && (i>=hFill || i <= lFill) || !tail&&(i<=hFill && i >=lFill ))
		if(wasFilling!=filling){
			ctx.lineTo(lMargin+(i-Xbounds[0])*barWidth, tMargin+chartHeight)
			ctx.fill()
			ctx.stroke()
			ctx.beginPath()
			ctx.moveTo(lMargin+(i-Xbounds[0])*barWidth, tMargin+chartHeight)
			ctx.fillStyle = (filling?fillColor:"white")
		}
		ctx.lineTo(lMargin+(i-Xbounds[0])*barWidth, tMargin+chartHeight+barHeight)
		ctx.lineTo(lMargin+(i-Xbounds[0]+1)*barWidth, tMargin+chartHeight+barHeight)
		

		}
	ctx.lineTo(lMargin+(Xbounds[1]-Xbounds[0]+1)*barWidth, tMargin+chartHeight)
	ctx.fill()
	ctx.stroke()
		
	} else {
		for (var i=Xbounds[0];i<=Xbounds[1];i++){
			if (tail && (i>=hFill || i <= lFill) || !tail&&(i<=hFill && i >=lFill )) {
				ctx.fillStyle= fillColor
			} else {ctx.fillStyle = "white";}
			var barHeight = -pmf(i)/maxDensity*chartHeight
	//		console.log(i + " " +barHeight)
			ctx.fillRect(lMargin+(i-Xbounds[0])*barWidth,chartHeight+tMargin,barWidth,barHeight)
			ctx.strokeRect(lMargin+(i-Xbounds[0])*barWidth,chartHeight+tMargin,barWidth,barHeight)
			ctx.stroke();
		}
	}

}
//-----------------------------------------------------
//           HISTOGRAM
//-----------------------------------------------------
function refreshHistogram(data=[], normalCurve=false, varName=''){
	if (!isOpen("headerHistogram")) return false;
//	alert("refreshing Histogram")
//	console.log(data)
console.log("refreshing histogram")
	var n=data.length
	if(n==0) {
		data = document.getElementById("data1").value.trim().split(/[\s,;\t\n]+/)
		n=data.length
		var myArray = [];
		for (var i = 0; i<n; i++){
			var index = data[i].indexOf("x")
			if(index>=0){
				var nTimes = parseInt(data[i].substring(0,index))
				var datum = parseFloat(data[i].substring(index+1))
				for(var j=0; j<nTimes; j++){
					myArray.push(datum)
				}
				} else {
				myArray.push(data[i])
			}
		}
		myArray.sort(function(a, b){return a-b})
		data = myArray
		data.sort(function(a, b){return a-b})
		for(var i=0; i<n; i++) { data[i] = +data[i]; }
	} 
	n=data.length
	normalCurve = (exists("overlayNormal") && document.getElementById('overlayNormal').checked)
	if(varName==''){
		histogram(data, normalCurve)
	}else{
		histogram(data, normalCurve, varName)
	}
}

function histogram(data=parseData(1), normalCurve=false, dataName=document.getElementById('name1').value, varUnits=document.getElementById('varUnits1').value, canvasName='histogram', forceIt=false,varName=exists('varName1')?document.getElementById('varName1').value:""){
	//console.log(forceIt)
//	alert("histogram")
	if (!forceIt && !isOpen("headerHistogram")) return false;
	//data=parseData(1)
	var n=data.length
	data.sort(function(a, b){return a-b})
	var fiveNumSummary = fiveNumSum(data)
	var IQR = fiveNumSummary[3]-fiveNumSummary[1]
	var c=document.getElementById(canvasName)
	var ctx=c.getContext("2d")
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	var scale=c.width/480
	var lMargin = 50*scale
	var rMargin = 30*scale
	var tMargin = 30*scale
	var bMargin = 35*scale
	var chartHeight=c.height - bMargin-tMargin
	var chartWidth=c.width - lMargin-rMargin
	//data=data.slice()
	var dataRange = jStat.range(data)
//	alert("calculating bins")
//	console.log(dataRange)
	var h , nBins
	nBinsOverride = 10
	if(exists('nBinsOverride') && isNumeric(document.getElementById('nBinsOverride').value))
	{
		nBins=parseInt(document.getElementById('nBinsOverride').value)
	} else if(document.getElementById('nBinsOverride').value=='fd' && IQR != 0){
		h= 2*IQR*Math.pow(n,-.33333)
		nBins = Math.round(dataRange / h)
	} else if(document.getElementById('nBinsOverride').value=='sqrt'){
		nBins = Math.round(Math.sqrt(n))
	} else if(document.getElementById('nBinsOverride').value=='sturges'){
		nBins = 1+ Math.ceil(Math.log2(n))
	} else if(document.getElementById('nBinsOverride').value=='rice'){
		h = Math.ceil(2 * Math.pow(n,.333333))
		nBins = Math.round(dataRange / h)
	} else if(document.getElementById('nBinsOverride').value=='doanes' && n>2){
		nBins = Math.round(1+Math.log2(n)+Math.log2(1+Math.abs(jStat.skewness(data)/Math.sqrt( 6*(n-2))/((n+1)*(n+3)))))
	} else if(document.getElementById('nBinsOverride').value=='scotts'){
		h = 3.5 * jStat.stdev(data,true)/Math.pow(n,.333333)
		nBins = Math.round(dataRange / h)
	} else {
		nBins= 4
	}
//	alert(nBins)
	
	//console.log(nBins)
	
	if(nBins<4) {nBins=4;}
	h=dataRange/nBins
	
	var allInt = true
	var discrete = false
	for(var i=0; i<n; i++){
		if(isFloat(data[i])) allInt = false;
	}
	var nBinsOld=nBins
	if(exists('discrete') && document.getElementById("discrete").checked && allInt){
		discrete=true
		nBins = jStat.range(data)+1
		h=1
	}
	
	var frequency = jStat.histogram(data,nBins)
	var maxFreq = jStat.max(frequency)
	var histogramWidth = c.width-lMargin-rMargin
	var binWidth = histogramWidth/nBins
	var binPrecision=Math.max(0,Math.ceil(-Math.log10(h)))
	var nTicksY = maxFreq/Math.max(1,Math.round(n/25))+1
	nTicksY=10
	step = maxFreq/nTicksY
//	var top=(cumulative?1:maxFreq);
//	var maxYTick 
	if(maxFreq <=10){
		step=1
//		console.log("step = 1");
	} else {
//		console.log("Maxfreq = "+maxFreq)
		var sig = maxFreq / Math.pow(10,(Math.floor(Math.log10(maxFreq))))
		var mag = Math.pow(10,Math.floor(Math.log10(maxFreq))-1)
		step = Math.ceil(sig)*mag
		maxFreq = Math.ceil(maxFreq/step)*step
//		console.log(sig)
//		console.log(mag)
//		console.log(step)
//		console.log(maxFreq)
	}
	
// 11,12 -> 12 step=2
// 13,14 -> 14 step=2
// 15,16 -> 16 step=2
// 17,18 -> 18 step=2
// 19,20 -> 20 step=2
// 21 -> 21 step=3
// 22,23,24 -> 24 step=3
// 25,26,27 -> 27 step=3	
// 28,29,30 -> 30 step=3
// 31,32 -> 32 step=4
// 33-36 -> 36 step=4
// 37-40 -> 40 step=4
// 41-45 -> 45 step=5
// 46-50 -> 50 step=5
	nTicksY = maxFreq/step 
	chartAxisY(ctx,lMargin,tMargin+chartHeight,tMargin,0,maxFreq,nTicksY,"Frequency",true,lMargin+chartWidth,true,fontSizeAxis*scale)
	
	
	ctx.fillStyle = (document.getElementById("colorful").checked?colorHex:"#C0C0C0");
	if(nBins<50){
		ctx.strokeStyle = "black";
	} else {
		ctx.strokeStyle = ctx.fillStyle;
		
	}
	for (var i=0; i<nBins; i++){
		ctx.fillRect(lMargin+(i)*binWidth,chartHeight+tMargin,binWidth,-frequency[i]/maxFreq*chartHeight)
			ctx.strokeRect(lMargin+(i)*binWidth,chartHeight+tMargin,binWidth,-frequency[i]/maxFreq*chartHeight)
			ctx.stroke()
	}
	ctx.strokeStyle = "black";
	
	if(normalCurve){
//		console.log("normal overlay")
		var s=jStat.stdev(data,true)
		var mu=jStat.mean(data)
		var curveScale = jStat.normal.pdf(0,0,1)
//		console.log(curveScale)
		ctx.beginPath()
		for(i=0; i<=50; i++){
			x=(jStat.min(data)+i/50*(jStat.range(data))-mu)/s
			y=jStat.normal.pdf(x,0,1)/curveScale
			if(i==0) ctx.moveTo(lMargin,c.height-bMargin-y*chartHeight)
			if(i>0) ctx.lineTo(lMargin+i/50*chartWidth,c.height-bMargin-y*chartHeight)
		}
		ctx.stroke()
	}
	chartTitle(ctx,dataName+' Frequency Histogram',lMargin+.5*chartWidth, 0,fontSizeTitle*scale);
	chartAxisX(ctx,chartHeight+tMargin+1,lMargin+(discrete?binWidth*.5:0),lMargin+chartWidth-(discrete?binWidth*.5:0),jStat.min(data),jStat.max(data),nBins-(discrete?1:0),varName+(varUnits==''?'':" ("+varUnits+")"),false,[],fontSizeAxis*scale)	
}

function renderHistogram(ctx, bounds, frequencies, fill){
	ctx.fillStyle=fill;
	ctx.strokeStyle=(frequencies.length<50?"black":fill)
	var lMargin=bounds[0], tMargin=bounds[1], chartWidth=bounds[2], chartHeight=bounds[3]
	var binWidth = chartWidth/frequencies.length
	var maxFreq=0
	for(var i=0; i<frequencies.length; i++) maxFreq=Math.max(frequencies[i],maxFreq)
		
	ctx.beginPath()
	for (var i=0; i<frequencies.length; i++){
		ctx.fillRect(lMargin+(i)*binWidth,chartHeight+tMargin,binWidth,-frequencies[i]/maxFreq*chartHeight)
		ctx.strokeRect(lMargin+(i)*binWidth,chartHeight+tMargin,binWidth,-frequencies[i]/maxFreq*chartHeight)
	}
	ctx.fill()
	ctx.stroke()
	
}

function histogramPlot(nSamples, canvasID='histogram'){
	if (!isOpen("headerHistogram")){ 
		return false;
	}
	var relative=true
	var c=document.getElementById("hist")
	var ctx=c.getContext("2d")

	var allData = []
	for(var dataset=1; dataset<=nSamples; dataset++){
		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		allData = allData.concat(data)	
	}
	var allN = allData.length
	for(var i=0; i<allN; i++) { allData[i] = +allData[i]; }
	allData.sort(function(a, b){return a-b})
	var fiveNumSummaryAll = fiveNumSum(allData)
	var IQRall = fiveNumSummaryAll[3]-fiveNumSummaryAll[1]
	var dataRangeAll = jStat.range(allData)

	var h , nBins
	if(isNumeric(document.getElementById('nPointsOverrideHist').value))
	{
		nBins=parseInt(document.getElementById('nPointsOverrideHist').value)
	} else if(document.getElementById('nPointsOverrideHist').value=='fd'){
		h= 2*IQRall*Math.pow(allN,-.33333)
		nBins = (h==0?4:Math.round(dataRangeAll / h))
	} else if(document.getElementById('nPointsOverrideHist').value=='sqrt'){
		nBins = Math.round(Math.sqrt(allN))
	} else if(document.getElementById('nPointsOverrideHist').value=='sturges'){
		nBins = 1+ Math.ceil(Math.log2(allN))
	} else if(document.getElementById('nPointsOverrideHist').value=='rice'){
		h = Math.ceil(2 * Math.pow(allN,.333333))
		nBins = Math.round(dataRangeAll / h)
	} else if(document.getElementById('nPointsOverrideHist').value=='doanes' && n>2){
		nBins = Math.round(1+Math.log2(allN)+Math.log2(1+Math.abs(jStat.skewness(allData)/Math.sqrt( 6*(allN-2))/((allN+1)*(allN+3)))))
	} else if(document.getElementById('nPointsOverrideHist').value=='scotts'){
		h = 3.5 * jStat.stdev(allData,true)/Math.pow(allN,.333333)
		nBins = Math.round(dataRangeAll / h)
	} else {
		nBins= 4
	}
	
	if(nBins<4) {nBins=4;}
	h=dataRangeAll/nBins
	
	var allInt = true
	var discrete = false
	for(var dataset=1; dataset<=nSamples; dataset++){
		data = parseData(dataset)
		var n=data.length
		for(var i=0; i<n; i++){
			if(isFloat(data[i])) allInt = false;
		}
	}
	if(document.getElementById("discreteFreqHist").checked && allInt){
		discrete=true
		nBins = jStat.range(allData)+1
		h=1
	}

	var maxFreq = new Array(nSamples)
	var frequency = new Array(nSamples)
	for(var i=0; i<nSamples; i++){
		maxFreq[i]=0
		frequency[i]=new Array(nBins)
		for(var j=0;j<nBins;j++){
			frequency[i][j]=0
		}
	}
	var minValue = jStat.min(allData)
//				alert(frequency)
	if(discrete) minValue -=.5
	for(var dataset=1; dataset<=nSamples; dataset++){
		data = parseData(dataset)
		n = data.length
		for(var i=0; i<n; i++){
			frequency[dataset-1][Math.min(Math.floor((data[i]-minValue)/h),nBins-1)]++
		}
		if(relative){
			for(var i=0; i<frequency[dataset-1].length; i++){
				frequency[dataset-1][i] /= n
			}
		}
		for(var i=0; i<nBins; i++){
			if(cumulative==true && i>0) frequency[dataset-1][i]+=frequency[dataset-1][i-1];
			if(frequency[dataset-1][i]>maxFreq[dataset-1]) maxFreq[dataset-1] = frequency[dataset-1][i]
		}
	}
	console.log(frequency)
	console.log(maxFreq)

	ctx.beginPath()
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	ctx.fill();
	var scale = c.width/480
	var lMargin = 50*scale
	var rMargin = 20*scale
	var tMargin = 30*scale
	var bMargin = 35*scale
	var chartHeight=c.height - bMargin-tMargin
	var chartWidth=c.width - lMargin-rMargin

	//console.log(maxFreq)
	var histogramWidth = c.width-lMargin-rMargin
	var cumulative=false
	var binWidth = histogramWidth/(nBins+(cumulative?0:1))
	var axisXlbl1 = jStat.min(allData)
	var axisXlbl2 = jStat.max(allData)
	var ticks = jStat.max(allData)-jStat.min(allData)+(cumulative?1:2)
	if(!discrete){
		axisXlbl1 = jStat.min(allData)-h/2
		axisXlbl2 = jStat.max(allData)+(cumulative?-1:1)*h/2
		ticks = nBins + (cumulative?0:1)
	}
	var binWidth = histogramWidth/nBins
	var binPrecision=Math.max(0,Math.ceil(-Math.log10(h)))

	chartAxisX(ctx,chartHeight+tMargin+1,lMargin+(discrete?binWidth*.5:0),lMargin+chartWidth-(discrete?binWidth*.5:0),axisXlbl1,axisXlbl2,nBins-(discrete?1:0),document.getElementById('varName1').value+(document.getElementById('varUnits1').value==''?'':" ("+document.getElementById('varUnits1').value+")"),false,[],fontSizeAxis*scale)	
	chartTitle(ctx,(cumulative?"Cumulative Relative ":"")+(relative?"Relative ":"")+"Frequency Histogram", lMargin+.5*chartWidth, 0,fontSizeTitle*scale);

	var gap= 12*scale
	var opaque=false
	var chart_plus_gap = (gap+(chartHeight-gap*(nSamples-1))/nSamples)
	var grpLabels=[]
	for(var dataset=0; dataset<nSamples; dataset++){
		grpLabels.push(document.getElementById('name'+(dataset+1)).value)
		var top=(cumulative?1:maxFreq[dataset]);
		var step=(cumulative?.1:(relative?maxFreq[dataset]/5:Math.max(1,Math.round(maxFreq[dataset]/5))))
		if(!cumulative && !relative && maxFreq[dataset] <=10){
			step=1
			//console.log("step = 1");
		}
		var nTicksY = top/step 
		var cHex = colorHexes[dataset]
		chartAxisY(ctx,lMargin,tMargin + (gap+(chartHeight-gap*(nSamples-1))/nSamples) * (dataset+1)-gap,tMargin + (gap+(chartHeight-gap*(nSamples-1))/nSamples) * dataset, 0 ,top ,nTicksY,"",true,lMargin+chartWidth,true,fontSizeAxis*scale)
		renderHistogram(ctx, [lMargin, tMargin + chart_plus_gap * dataset, chartWidth, (chartHeight-gap*(nSamples-1))/nSamples], frequency[dataset],	opaque?cHex:"rgba("+hexToRgb(cHex).r +","+hexToRgb(cHex).g +","+hexToRgb(cHex).b +",.2)")
	}
//	chartAxisY(ctx,lMargin,tMargin + (gap+(chartHeight-gap*(nSamples-1))/nSamples) * (dataset+1)-gap,tMargin + (gap+(chartHeight-gap*(nSamples-1))/nSamples) * dataset, 0 ,top ,nTicksY,,true,lMargin+chartWidth)
	chartAxisLabelsY(ctx,[(cumulative?"Cumulative Relative ":"")+(relative?"Relative ":"")+"Frequency"],10*scale,tMargin,chartHeight,true,fontSizeAxis*scale)
	
	chartGroupLabels(ctx, grpLabels,lMargin+5,tMargin+10*scale,chart_plus_gap,true,fontSizeAxis*scale)
}

//------------------------------------------------------
//         UNIVARIATE PLOTS
//------------------------------------------------------
function frequencyPolygon(nPolygons, dataName=document.getElementById('name1').value, varUnits=document.getElementById('varUnits1').value, varName=exists('varName1')?document.getElementById('varName1').value:""){
	if (!isOpen("headerfrequencyPolygon")){ 
		return false;
	}
	var relative=(nPolygons>1?true:false)
	var c=document.getElementById("freqPolygon")
	var ctx=c.getContext("2d")
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	var scale = c.width/480
	var lMargin = 50*scale
	var rMargin = 20*scale
	var tMargin = 30*scale
	var bMargin = 35*scale
	var chartHeight=c.height - bMargin-tMargin
	var chartWidth=c.width - lMargin-rMargin

	var allData = []
	for(var dataset=1; dataset<=nPolygons; dataset++){
		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		allData = allData.concat(data)	
	}
	var allN = allData.length
	for(var i=0; i<allN; i++) { allData[i] = +allData[i]; }
	allData.sort(function(a, b){return a-b})
	var fiveNumSummaryAll = fiveNumSum(allData)
	var IQRall = fiveNumSummaryAll[3]-fiveNumSummaryAll[1]
	var dataRangeAll = jStat.range(allData)

	var h , nBins
	if(isNumeric(document.getElementById('nPointsOverride').value))
	{
		nBins=parseInt(document.getElementById('nPointsOverride').value)
	} else if(document.getElementById('nPointsOverride').value=='fd' && IQRall>0){
		h= 2*IQRall*Math.pow(allN,-.33333)
		nBins = Math.round(dataRangeAll / h)
	} else if(document.getElementById('nPointsOverride').value=='sqrt'){
		nBins = Math.round(Math.sqrt(allN))
	} else if(document.getElementById('nPointsOverride').value=='sturges'){
		nBins = 1+ Math.ceil(Math.log2(allN))
	} else if(document.getElementById('nPointsOverride').value=='rice'){
		h = Math.ceil(2 * Math.pow(allN,.333333))
		nBins = Math.round(dataRangeAll / h)
	} else if(document.getElementById('nPointsOverride').value=='doanes' && n>2){
		nBins = Math.round(1+Math.log2(allN)+Math.log2(1+Math.abs(jStat.skewness(allData)/Math.sqrt( 6*(allN-2))/((allN+1)*(allN+3)))))
	} else if(document.getElementById('nPointsOverride').value=='scotts'){
		h = 3.5 * jStat.stdev(allData,true)/Math.pow(allN,.333333)
		nBins = Math.round(dataRangeAll / h)
	} else {
		nBins= 4
	}
	
	if(nBins<4) {nBins=4;}
	h=dataRangeAll/nBins
	
	var allInt = true
	var discrete = false
	for(var dataset=1; dataset<=nPolygons; dataset++){
		data = parseData(dataset)
		var n=data.length
		for(var i=0; i<n; i++){
			if(isFloat(data[i])) allInt = false;
		}
	}
	if(document.getElementById("discreteFreq").checked && allInt){
		discrete=true
		nBins = jStat.range(allData)+1
		h=1
	}

	var cumulative=false;
	if(document.getElementById("cumulative").checked==true){
		cumulative=true;
		relative=false;
	}
	
	
	var maxFreq = 0
	var frequency = new Array(nPolygons)
	for(var i=0; i<nPolygons; i++){
		frequency[i]=new Array(nBins)
		for(var j=0;j<nBins;j++){
			frequency[i][j]=0
		}
	}
	var minValue = jStat.min(allData)
//				alert(frequency)
	if(discrete) minValue -=.5
	for(var dataset=1; dataset<=nPolygons; dataset++){
		data = parseData(dataset)
		n = data.length
		for(var i=0; i<n; i++){
			frequency[dataset-1][Math.min(Math.floor((data[i]-minValue)/h),nBins-1)]++
		}
		if(relative){
			for(var i=0; i<frequency[dataset-1].length; i++){
				frequency[dataset-1][i] /= n
			}
		}
		for(var i=0; i<nBins; i++){
			if(cumulative==true && i>0) frequency[dataset-1][i]+=frequency[dataset-1][i-1];
			if(frequency[dataset-1][i]>maxFreq) maxFreq = frequency[dataset-1][i]
		}
	}

	//console.log(maxFreq)
	var histogramWidth = c.width-lMargin-rMargin
	var binWidth = histogramWidth/(nBins+(cumulative?0:1))
	var top=(cumulative?1:maxFreq);
	var step=(cumulative?.1:(relative?maxFreq/10:Math.max(1,Math.round(maxFreq/10))))
	var nTicksY = top/step 
	var axisXlbl1 = jStat.min(allData)-1
	var axisXlbl2 = jStat.max(allData)+(cumulative?0:1)
	var ticks = jStat.max(allData)-jStat.min(allData)+(cumulative?1:2)
	if(!discrete){
		axisXlbl1 = jStat.min(allData)-h/2
		axisXlbl2 = jStat.max(allData)+(cumulative?-1:1)*h/2
		ticks = nBins + (cumulative?0:1)
	}
	
	chartAxisX(ctx,chartHeight+tMargin+1,lMargin,lMargin+chartWidth,axisXlbl1,axisXlbl2,ticks,varName+(varUnits==''?'':" ("+varUnits+")"),false,[], fontSizeAxis*scale)
	chartTitle(ctx,(nPolygons==1?dataName+" ":"")+(cumulative?"Cumulative Relative ":"")+(relative?"Relative ":"")+"Frequency Polygon", lMargin+.5*chartWidth, 0, fontSizeTitle*scale);
	chartAxisY(ctx,lMargin,tMargin+chartHeight,tMargin,0,top,nTicksY,(cumulative?"Cumulative Relative ":"")+(relative?"Relative ":"")+"Frequency",true,lMargin+chartWidth, true, fontSizeAxis*scale)

	ctx.lineWidth=scale;

	for(var dataset=0; dataset<nPolygons; dataset++){
		ctx.strokeStyle=colors[labelColors[dataset]];
		ctx.beginPath();
		ctx.moveTo(lMargin, tMargin+chartHeight)
		for (var i=0; i<nBins; i++){
			if(cumulative)
				ctx.lineTo(lMargin+(i+1)*binWidth,chartHeight+tMargin-frequency[dataset][i]/frequency[dataset][nBins-1]*chartHeight);
			else
				ctx.lineTo(lMargin+(i+1)*binWidth,chartHeight+tMargin-frequency[dataset][i]/maxFreq*chartHeight);
			
		}
		ctx.lineTo(lMargin+chartWidth,tMargin+(cumulative?0:chartHeight));
		ctx.stroke()
	}
	
	if(nPolygons>1){
		var names=[]
		for(var i=1; i<=nPolygons; i++) names.push(document.getElementById("name"+i).value)
		makeLegend(ctx,chartWidth+lMargin, tMargin+(cumulative?chartHeight:0), names,"white","lines",!cumulative,fontSizeAxis*scale)		
	}
}

function ecdf(nSamples=1, zigzag=false, dataName=document.getElementById('name1').value, varUnits=document.getElementById('varUnits1').value, varName=exists('varName1')?document.getElementById('varName1').value:""){
	if (!isOpen("headerECDF")){ return false;}
	var c=document.getElementById("ecdf")
	var ctx=c.getContext("2d")
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	var scale = c.width/480
	var lMargin = 50*scale, rMargin = 20*scale, tMargin = 30*scale, bMargin = 35*scale
	var chartHeight=c.height - bMargin-tMargin
	var chartWidth=c.width - lMargin-rMargin

	var allData = []
	for(var dataset=1; dataset<=nSamples; dataset++){
		var data = parseData(dataset)
		allData = allData.concat(data)	
	}
	var allN = allData.length
	for(var i=0; i<allN; i++) { allData[i] = +allData[i]; }
	allData.sort(function(a, b){return a-b})
	var minAll = jStat.min(allData)
	var maxAll = jStat.max(allData)

	var minValue = minAll-(maxAll-minAll)*.05
	var maxValue = maxAll+(maxAll-minAll)*.05
	var fullRange = maxValue-minValue
	
	chartAxisX(ctx,chartHeight+tMargin+1,lMargin,lMargin+chartWidth,minValue,maxValue,11,varName+(varUnits==''?'':" ("+varUnits+")"),false,[], fontSizeAxis*scale)
	chartAxisY(ctx,lMargin,chartHeight+tMargin+1,tMargin,0,1,10,"Cumulative Probability",true,lMargin+chartWidth, true, fontSizeAxis*scale)
	chartTitle(ctx,(nSamples==1?dataName+" ":"")+"Empirical CDF", lMargin+.5*chartWidth, 0, fontSizeTitle*scale);
	
	ctx.lineWidth=scale;
	
	for(var dataset=1; dataset<=nSamples; dataset++){
		var data = parseData(dataset)
//		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		var n = data.length
		for(var i=0; i<n; i++) { data[i] = +data[i]; }
		data.sort(function(a, b){return a-b})

		ctx.strokeStyle=colors[labelColors[dataset-1]];
		ctx.beginPath();
		var x=lMargin+(data[0]-minValue)/fullRange * chartWidth
		var y= tMargin+chartHeight - 0/n*chartHeight
		ctx.moveTo(x, y)
		for (var i=0; i<n; i++){
			x=lMargin+(data[i]-minValue)/fullRange * chartWidth
			if(zigzag) ctx.lineTo(x,y);
			y=tMargin+chartHeight - (i+1)/(n)*chartHeight
			if(zigzag || i==n-1 || data[i+1]>data[i]) ctx.lineTo(x,y);
			
		}
		ctx.stroke()
	}
	if(nSamples>1){
		var names=[]
		for(var i=1; i<=nSamples; i++) names.push(document.getElementById("name"+i).value)
		makeLegend(ctx,chartWidth+lMargin, tMargin+chartHeight, names,"white","lines",false,fontSizeAxis*scale)		
	}
}

function autoBandwidth(data){
	var n=data.length
	var fiveNumSummary = fiveNumSum(data)
	var IQR = fiveNumSummary[3]-fiveNumSummary[1]
	var A = Math.min(jStat.stdev(data,true),IQR/1.34)
	var S1 = 0.9*A*Math.pow(n,-1/5)
	var epsilon = .01
	var h0=S1
	h1=h0+epsilon
	var step=0;
	while(Math.abs(h1-h0)>epsilon){
		step++
		h0=h1
		var k4=3*n*h0
		var sum=0
		for(var i=1; i<n; i++){
			for(var j=0; j<i; j++){
				sum += ( Math.pow( Math.pow(data[i]-data[j],2)-6*Math.pow(h0,2),2)-24*Math.pow(h0,4))*Math.exp(-Math.pow((data[i]-data[j])/(2*h0),2))
			}
		}
		k4 += sum / (2* Math.pow(h0,3))
		h1 = Math.pow( 4 * n * Math.pow(h0,6) / k4,1/5)
		if(step>100) break;
	}
	return h1;
}

function violinplot(nSamples, labels=[]){
	if (!isOpen("headerViolinPlot")) return false;
	var c=document.getElementById("violinplot")
	var ctx=c.getContext("2d")
	ctx.fillStyle = "white";
//	ctx.textAlign = "center";
//	ctx.font = "12px  sans-serif";
	ctx.fillRect(0, 0, c.width, c.height);
	var scale = c.width/480
	var lMargin = 50*scale
	var rMargin = 20*scale
	var tMargin = 20*scale
	var bMargin = 35*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	var eachPlotHeight = chartHeight/nSamples
	var violinArea = []

	var allData = []
	var maxBW = 0
	for(var dataset=1; dataset<=nSamples; dataset++){
		violinArea[dataset-1]=0
		var data = parseData(dataset)
		var bandwidth = autoBandwidth(data)
		maxBW=Math.max(bandwidth,maxBW)
		allData = allData.concat(data)	
	}
	var allN = allData.length
	for(var i=0; i<allN; i++) { allData[i] = +allData[i]; }
	allData.sort(function(a, b){return a-b})
//	var bandwidth = autoBandwidth(allData)
	var bandwidth=maxBW
	var hBuffer=2
	var fiveNumSummaryAll = fiveNumSum(allData)
	var xMin = fiveNumSummaryAll[0]-bandwidth*hBuffer, xMax=fiveNumSummaryAll[4]+bandwidth*hBuffer;
	var dataRangeAll = jStat.range(allData)
	var nBins = 11
	var h=(xMax-xMin)/nBins
	
	var resolution = 2
	step = (dataRangeAll+2*hBuffer)/(chartWidth/resolution);
	
	for(var dataset=1; dataset<=nSamples; dataset++){
		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		var n=data.length;
		for(var i=0; i<n; i++) { data[i] = +data[i]; }
		data.sort(function(a, b){return a-b})
		var f = []
		var i=0;
		var maxF = 0;
		var dataMin = jStat.min(data)-bandwidth*hBuffer
		var dataMax = jStat.max(data)+bandwidth*hBuffer
		//alert(dataMin + " " + dataMax)
		for(var x=dataMin; x<dataMax;x+=step){
			f[i]=0
			for(var j=0; j<n; j++){
				f[i]+=1/(Math.sqrt(2)*Math.PI)*Math.exp(-.5*Math.pow((data[j]-x)/bandwidth,2))
			}
			f[i]*= 1/(n*bandwidth)
			maxF=Math.max(maxF,f[i])
			i++;
		}
		var i=0;
		ctx.beginPath();
		var cHex = colorHexes[labelColors[dataset-1]]
		if (document.getElementById("colorful").checked==true)
			ctx.fillStyle = "rgba("+hexToRgb(cHex).r +","+hexToRgb(cHex).g +","+hexToRgb(cHex).b +",.3)";
		else
			ctx.fillStyle = "#C0C0C0";
		ctx.strokeStyle="black";
		ctx.lineWidth=1;
		ctx.moveTo(lMargin+ ((dataMin-xMin)/(xMax-xMin))* chartWidth,tMargin+(dataset-.5)*eachPlotHeight)
		var d=0
		for(var i=0; i<f.length; i++){
			x=dataMin + i*step
			d= f[i]/maxF * eachPlotHeight/2*.9;
			violinArea[dataset-1]+=d*(step/(xMax-xMin)*chartWidth)*2
			ctx.lineTo(lMargin+ ((x-xMin)/(xMax-xMin)) * chartWidth, tMargin+(dataset-.5)*eachPlotHeight-d)
		}
		ctx.lineTo(lMargin+ ((dataMax-xMin)/(xMax-xMin))* chartWidth, tMargin+(dataset-.5)*eachPlotHeight-d)
		ctx.lineTo(lMargin+ ((dataMax-xMin)/(xMax-xMin))* chartWidth, tMargin+(dataset-.5)*eachPlotHeight+d)
		for(var i=f.length-1; i>=0; i--){
			x=dataMin+i*step
			var d= f[i]/maxF * eachPlotHeight/2*.9;
			ctx.lineTo(lMargin+ ((x-xMin)/(xMax-xMin)) * chartWidth, tMargin+(dataset-.5)*eachPlotHeight+d)
		}
		ctx.lineTo(lMargin+ ((dataMin-xMin)/(xMax-xMin))* chartWidth,tMargin+(dataset-.5)*eachPlotHeight+d)
		ctx.lineTo(lMargin+ ((dataMin-xMin)/(xMax-xMin))* chartWidth,tMargin+(dataset-.5)*eachPlotHeight)
		ctx.fill();
		ctx.stroke();
		
		
		var lineMid = tMargin+(dataset-.5)*eachPlotHeight
		var boxsize=.1
		var diamondSize=10
		if(nSamples>4) diamondSize = 10-(nSamples-4)

		//------------------- BOXPLOT-----------------------------
		if(document.getElementById('violinInterior').value=="boxplot"){
			if (document.getElementById("colorful").checked==true)
				ctx.fillStyle = "rgba("+hexToRgb(colorHex).r +","+hexToRgb(colorHex).g +","+hexToRgb(colorHex).b +",.5)";
			else
				ctx.fillStyle = "#999";
			ctx.lineWidth=2
			ctx.beginPath();
			fns=fiveNumSum(data)
			//box
//			ctx.fillRect(lMargin + (fns[1]-xMin)/(xMax-xMin)*chartWidth, lineMid-eachPlotHeight*boxsize,(fns[3]-fns[1])/(xMax-xMin)*chartWidth, 2*eachPlotHeight*boxsize)
//			ctx.fill()
			ctx.rect(lMargin + (fns[1]-xMin)/(xMax-xMin)*chartWidth, lineMid-eachPlotHeight*boxsize,(fns[3]-fns[1])/(xMax-xMin)*chartWidth, 2*eachPlotHeight*boxsize)
			ctx.stroke();
			//median line
			ctx.moveTo(lMargin + (fns[2]-xMin)/(xMax-xMin)*chartWidth, lineMid-eachPlotHeight*boxsize)
			ctx.lineTo(lMargin + (fns[2]-xMin)/(xMax-xMin)*chartWidth, lineMid+eachPlotHeight*boxsize)
			ctx.stroke()
			//whiskers
			ctx.moveTo(lMargin + (fns[1]-xMin)/(xMax-xMin)*chartWidth, lineMid)
			ctx.lineTo(lMargin + (Math.max(fns[0], fns[1]-1.5*(fns[3]-fns[1]))-xMin)/(xMax-xMin)*chartWidth, lineMid)
			ctx.stroke()
			ctx.moveTo(lMargin + (fns[3]-xMin)/(xMax-xMin)*chartWidth, lineMid)
			ctx.lineTo(lMargin + (Math.min(fns[4], fns[3]+1.5*(fns[3]-fns[1]))-xMin)/(xMax-xMin)*chartWidth, lineMid)
			ctx.stroke()
			ctx.lineWidth=1
		//------------------- MEAN / SD -----------------------------
		} else if (document.getElementById('violinInterior').value=="meanSD"){
			var xbar = jStat.mean(data)
			var sd = jStat.stdev(data,true)
			ctx.beginPath()
			ctx.lineWidth=2
//			alert(xbar + " "+sd)
			ctx.moveTo(lMargin + (xbar-sd-xMin)/(xMax-xMin)*chartWidth, lineMid)
			ctx.lineTo(lMargin + (xbar+sd-xMin)/(xMax-xMin)*chartWidth, lineMid)
			ctx.stroke()

			ctx.beginPath()
			ctx.fillStyle="black"
			ctx.moveTo(lMargin + (xbar-xMin)/(xMax-xMin)*chartWidth-diamondSize, lineMid)
			ctx.lineTo(lMargin + (xbar-xMin)/(xMax-xMin)*chartWidth, lineMid-diamondSize)
			ctx.lineTo(lMargin + (xbar-xMin)/(xMax-xMin)*chartWidth+diamondSize, lineMid)
			ctx.lineTo(lMargin + (xbar-xMin)/(xMax-xMin)*chartWidth, lineMid+diamondSize)
			ctx.fill()
			ctx.lineWidth=1
		//------------------- DOT PLOT-----------------------------
		} else if (document.getElementById('violinInterior').value=="data"){
			var pointSize = 3/nSamples
//			alert(violinArea[dataset-1])
			pointSize = Math.sqrt(violinArea[dataset-1]/n)/6
			var counts = new Array( Math.round(chartWidth / (pointSize*2.5)))	
			for(var i=0; i<counts.length; i++) counts[i]=0;
			for(var i=0; i<n; i++){
				counts[Math.floor((data[i]-xMin)/(xMax-xMin)*counts.length)]++
			}
			ctx.fillStyle="black"
			for(var i=0; i<counts.length; i++){
				for(var j=0; j<counts[i]; j++){
					ctx.beginPath();
					ctx.arc(lMargin+i/counts.length*chartWidth,lineMid-((counts[i]-1)- 2*j)*pointSize*1.25, pointSize, 0, 2 * Math.PI);
					ctx.fill();
				}
			}
		//------------------- STRIP CHART -----------------------------
		} else if (document.getElementById('violinInterior').value=="strip"){
			ctx.beginPath()
			ctx.lineWidth=.5;
			for(var i=0; i<n; i++){
				var x=lMargin + (data[i]-xMin)/(xMax-xMin)*chartWidth
				ctx.moveTo(x, lineMid-eachPlotHeight*boxsize)
				ctx.lineTo(x, lineMid+eachPlotHeight*boxsize)
			}
			ctx.stroke()
			var x=lMargin + (jStat.mean(data)-xMin)/(xMax-xMin)*chartWidth
			ctx.beginPath()
			ctx.lineWidth=2;
			ctx.moveTo(x, lineMid-eachPlotHeight*.45)
			ctx.lineTo(x, lineMid+eachPlotHeight*.45)
			ctx.stroke();
		}
		if(labels.length>dataset-1) {
			ctx.beginPath();
			ctx.fillStyle="black"
			ctx.font = fontSizeAxis*scale+"px  sans-serif"
			ctx.textAlign = "left";
			ctx.textBaseline="top";
			ctx.fillText(labels[dataset-1], lMargin+ ((dataMin-xMin)/(xMax-xMin))* chartWidth,lineMid-eachPlotHeight*.25);
			ctx.fill()
		}
	}
	
	var binWidth = chartWidth/nBins	
	var yLabs=[]
	for(var i=1; i<=nSamples; i++) yLabs.push(document.getElementById("name"+i).value)
	
//	chartAxisLabelsY(ctx,yLabs,lMargin-30,tMargin,eachPlotHeight, false, fontSizeAxis*scale)
	chartAxisX(ctx,chartHeight+tMargin+1,lMargin,c.width-rMargin,xMin,xMin+h*nBins,nBins,document.getElementById('varName1').value+(document.getElementById('varUnits1').value==''?'':" ("+document.getElementById('varUnits1').value+")"),false,[], fontSizeAxis*scale)
	chartTitle(ctx,'Violin Plot',lMargin+.5*chartWidth, 0, fontSizeTitle*scale);
	chartGroupLabels(ctx, yLabs,4,tMargin+eachPlotHeight*.9, eachPlotHeight, true, fontSizeAxis*scale)
}

function boxplot(nBoxPlots, labels=[]){
	if (!isOpen("headerBoxplot")) return false;
	var c=document.getElementById("boxplot")
	var ctx=c.getContext("2d")
	clearCanvas(ctx,c.width,c.height)
//	ctx.fillStyle = "white";
//	ctx.fillRect(0, 0, c.width, c.height);
//	ctx.textAlign = "center";
//	ctx.font = "12px  sans-serif";
	var scale = c.width/480
	var lMargin = 50 * scale
	var rMargin = 20 *scale
	var tMargin = 20 *scale
	var bMargin = 35 *scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	var eachBoxHeight = chartHeight/nBoxPlots

	var allData = []
	for(var dataset=1; dataset<=nBoxPlots; dataset++){
		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		allData = allData.concat(data)	
	}
	var allN = allData.length
	for(var i=0; i<allN; i++) { allData[i] = +allData[i]; }
	allData.sort(function(a, b){return a-b})
	var fiveNumSummaryAll = fiveNumSum(allData)
	var IQRall = fiveNumSummaryAll[3]-fiveNumSummaryAll[1]
	var h= 2*IQRall*Math.pow(allN,-.33333)
	var dataRangeAll = jStat.range(allData)
	var nBins = Math.round(dataRangeAll / h)
	if(nBins<4) {nBins=4}
	h=dataRangeAll/nBins
	var binWidth = chartWidth/nBins	
	var stagger = false;
	if (nBoxPlots>5) stagger = true
	var offset = 0;
	var yLabs=[]
	for(var dataset=1; dataset<=nBoxPlots; dataset++){
	
		ctx.fillStyle=colors[labelColors[dataset-1]];
		ctx.strokeStyle="black";

		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		var n=data.length
		data.sort(function(a, b){return a-b})
		for(var i=0; i<n; i++) { data[i] = +data[i]; }
		var fiveNumSummary = fiveNumSum(data)
		var IQR = fiveNumSummary[3]-fiveNumSummary[1]
		var uF=fiveNumSummary[3]+1.5*IQR
		var lF=fiveNumSummary[1]-1.5*IQR
		if (uF>data[n-1]) uF=data[n-1]
		if (lF<data[0]) lF=data[0]
		var dataRange = jStat.range(data)
	
		//Draw dots for outliers and determine whisker lengths
		for(var i=0; i<n;i++){
			if(data[i]<lF || data[i]>uF){
				ctx.beginPath();
				ctx.arc(lMargin+(data[i]-allData[0])/dataRangeAll*chartWidth,tMargin+eachBoxHeight*(dataset-.5), 2*scale, 0, 2 * Math.PI);
				ctx.fill();
				ctx.stroke();
			}
			if(i>0 && data[i]>=lF && data[i-1]<lF) lF=data[i]
			if(i>0 && data[i]>uF && data[i-1]<=uF) uF=data[i-1]
		}
		
		//ctx.fillStyle=colors[dataset-1];
		if(nBoxPlots==1){		
			if (document.getElementById("colorful").checked==true)
				ctx.fillStyle = "rgba("+hexToRgb(colorHex).r +","+hexToRgb(colorHex).g +","+hexToRgb(colorHex).b +",.5)";
			else
				ctx.fillStyle = "#999";
		} else {
			if (document.getElementById("colorful").checked==true){
				var cHex=colorHexes[labelColors[dataset-1]]
				ctx.fillStyle = "rgba("+hexToRgb(cHex).r +","+hexToRgb(cHex).g +","+hexToRgb(cHex).b +",.3)";
			}else
				ctx.fillStyle = "#FFF";
		}
		ctx.lineWidth=2*scale;
		ctx.fillRect(lMargin+(fiveNumSummary[1]-allData[0])/dataRangeAll*chartWidth,tMargin+eachBoxHeight*(dataset-.5-.4),(fiveNumSummary[3]-fiveNumSummary[1])/dataRangeAll*chartWidth ,eachBoxHeight*(.8))
		ctx.fill()
		
		var xMarks=[lF,fiveNumSummary[1], fiveNumSummary[2],fiveNumSummary[3], uF]
		//draw the vertical lines
		for(var i=0; i<5;i++){
			var markHeight=.40
			if(i==0 || i==4) markHeight=.2
			if(i==2){ctx.lineWidth=4*scale;}else{ctx.lineWidth=2*scale;}
			ctx.beginPath();
			ctx.moveTo(lMargin+(xMarks[i]-allData[0])/dataRangeAll*chartWidth,tMargin+eachBoxHeight*(dataset-.5+markHeight));
			ctx.lineTo(lMargin+(xMarks[i]-allData[0])/dataRangeAll*chartWidth,tMargin+eachBoxHeight*(dataset-.5-markHeight));
			ctx.stroke();
		}
		//draw the horizontal lines on the top and bottom of the box
		for(var mark=0; mark<=1;mark++){
			markHeight = .10+.80*mark
			ctx.beginPath();
			ctx.moveTo(lMargin+(xMarks[1]-allData[0])/dataRangeAll*chartWidth,tMargin+eachBoxHeight*(dataset-1+markHeight));
			ctx.lineTo(lMargin+(xMarks[3]-allData[0])/dataRangeAll*chartWidth,tMargin+eachBoxHeight*(dataset-1+markHeight));
			ctx.stroke();
		}
		//draw the horizontal lines in the middle
		for(var i=0; i<=3;i+=3){
			ctx.beginPath();
			ctx.moveTo(lMargin+(xMarks[i]-allData[0])/dataRangeAll*chartWidth,tMargin+eachBoxHeight*(dataset-.5));
			ctx.lineTo(lMargin+(xMarks[i+1]-allData[0])/dataRangeAll*chartWidth,tMargin+eachBoxHeight*(dataset-.5));
			ctx.stroke();
		}		
		yLabs.push(document.getElementById("name"+dataset).value)
		if(labels.length>dataset-1) {
			ctx.beginPath();
			ctx.fillStyle="black"
			ctx.font = fontSizeAxis*scale+"px  sans-serif"
			ctx.textAlign = "right";
			ctx.textBaseline="top";
			ctx.fillText(labels[dataset-1], lMargin+(xMarks[1]-allData[0])/dataRangeAll*chartWidth-2*scale,tMargin+eachBoxHeight*(dataset-1+.10));
			ctx.fill()
		}
		
	}

	chartAxisX(ctx,chartHeight+tMargin+1,lMargin,c.width-rMargin,jStat.min(allData),jStat.max(allData),nBins,document.getElementById('varName1').value+(document.getElementById('varUnits1').value==''?'':" ("+document.getElementById('varUnits1').value+")"),false,[], fontSizeAxis*scale)
	chartTitle(ctx,'Box Plot',lMargin+.5*chartWidth, 0, fontSizeTitle*scale);
//	chartAxisLabelsY(ctx,yLabs,lMargin-30,tMargin,eachBoxHeight, false, fontSizeAxis*scale)
	chartGroupLabels(ctx, yLabs,4,tMargin+eachBoxHeight*.9, eachBoxHeight, true, fontSizeAxis*scale)
}

function beeswarm(nPlots){
	if (!isOpen("headerBeeswarm")) return false;
	var method=document.getElementById("beeswarmStyle").value
	var c=document.getElementById("beeswarm")
	var ctx=c.getContext("2d")
	ctx.textAlign = "center";
	ctx.font = "12px  sans-serif";
	var scale = c.width/480
	var lMargin = 50*scale
	var rMargin = 20*scale
	var tMargin = 20*scale
	var bMargin = 35*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	var eachBoxHeight = chartHeight/nPlots

	var hiddenCanvas = document.createElement('canvas');
	//var hiddenCanvas = document.getElementById('beeswarmHIDDEN');
	hiddenCanvas.width=c.width;
	hiddenCanvas.height=c.height;
	var hiddenCTX = hiddenCanvas.getContext('2d');

	var allData = []
	
	for(var dataset=1; dataset<=nPlots; dataset++){
		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		allData = allData.concat(data)	
	}
	var allN = allData.length
	for(var i=0; i<allN; i++) { allData[i] = +allData[i]; }
	allData.sort(function(a, b){return a-b})
	var fiveNumSummaryAll = fiveNumSum(allData)
	var IQRall = fiveNumSummaryAll[3]-fiveNumSummaryAll[1]
	var dataRangeAll = jStat.range(allData)
	var nBins = 10
	var h=dataRangeAll/nBins
	var binWidth = chartWidth/nBins	
	var stagger = false;
	if (nPlots>5) stagger = true
	var offset = 0;	
	clearCanvas(ctx,c.width,c.height)
				
	var yLabs=[]
	var chartBoundHeight = chartHeight/nPlots 
	
	for(var dataset=1; dataset<=nPlots; dataset++){
		ctx.save();
		ctx.beginPath();
//		ctx.rect(lMargin-5*scale,tMargin+(dataset-1)*chartHeight/nPlots,chartWidth+10*scale,chartHeight/nPlots)
		ctx.rect(0,tMargin+(dataset-1)*chartHeight/nPlots,c.width,chartHeight/nPlots)
			ctx.clip();
		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		var n=data.length
		data.sort(function(a, b){return a-b})
		for(var i=0; i<n; i++) { data[i] = +data[i]; }
		var dataRange = jStat.range(data)
	
		var dotRadius=5
//		if(n>500) dotRadius=2
//		if(n>2000) dotRadius=1
		dotRadius = Math.sqrt((chartWidth*(chartHeight)/nPlots/4) / n)/2.5
		var yMid = tMargin+eachBoxHeight*(dataset-.5);

		clearCanvas(hiddenCTX, c.width, c.height);
		if(method=="stack"){
		
			do{
				clearCanvas(ctx, c.width, c.height);	
				ctx.fillStyle=colors[labelColors[dataset-1]];
				ctx.strokeStyle=colors[dataset-1];
				clearCanvas(hiddenCTX, c.width, c.height);
				hiddenCTX.fillStyle="black";
				var dataDoing = []
				var dataToDo = data
				var side=1
				var stackRow = 0
				var dotOffset = 0
				var direction = 1
				var tooWide=false
				do{
	//				console.log("stackRow = "+stackRow)
	//				console.log("dataToDo = "+dataToDo)
					dataDoing = dataToDo
					dataToDo = []
					//alert("dataDoing = "+dataDoing)
					dotOffset = stackRow * dotRadius*2.5
					
					for(var i=0; i<dataDoing.length; i++){
						var index = (direction==1?i:dataDoing.length-i-1);
						
						var tryAgain = false;
						var x=lMargin+(dataDoing[index]-allData[0])/dataRangeAll*chartWidth
						var y=yMid+side*dotOffset
						var clearSpot = isClearSpot(hiddenCTX,x,y) || y<tMargin || y>tMargin+chartHeight
//						if () clearSpot=true;
						
						var moveIn = (dotOffset>=1 && isClearSpot(hiddenCTX,x,yMid+side*(dotOffset-scale)))
						var swapSides = (dotOffset>=1 && isClearSpot(hiddenCTX,x,yMid-side*(dotOffset)))
						var swapSidesAndMoveIn = (dotOffset>=1 && isClearSpot(hiddenCTX,x,yMid-side*(dotOffset-scale)))
						if(clearSpot){
							if(moveIn){
								dotOffset-=scale
								tryAgain=true;							
							} else if (swapSidesAndMoveIn){
								side *= -1;
								dotOffset-=scale;
								tryAgain=true;
							} else {
								if(Math.abs(y-yMid)>chartBoundHeight/2){
									tooWide=true;
									dataToDo=[];
									break;
								}
								drawDot(ctx, hiddenCTX, x, y, dotRadius)
							}
						} else {
							if(swapSides){
								side *=-1;
								tryAgain=true;
							} else {
								dataToDo.push(dataDoing[index])						
							}
						}
						if(tryAgain){ 
							i--;
						} else {
							dotOffset = stackRow * dotRadius*2.5
						}
					}
					stackRow++				
					direction *= -1
				} while(dataToDo.length>0)
				dotRadius *=.9
			} while(tooWide)
		} else if (method=="neat" || method=="bars") {
			var counts = []
			do{
				var tooWide=false
				var counts = new Array( Math.round(chartWidth / (dotRadius*2.2)))	
				for(var i=0; i<counts.length; i++) counts[i]=0;
				for(var i=0; i<n; i++){
					var idx=Math.min(counts.length-1,Math.round((data[i]-allData[0])/dataRangeAll*counts.length))
					counts[idx]++
					if(counts[idx] * dotRadius*2.2 > chartBoundHeight){ tooWide=true; break;}
				}
				dotRadius*=.9
			} while(tooWide)
			ctx.fillStyle=colors[labelColors[dataset-1]];
			for(var i=0; i<counts.length; i++){
				var baseline=(method=="neat"? yMid+((counts[i]-1))*dotRadius*1.1:tMargin+(chartHeight/nPlots)*(dataset)-.85*dotRadius)
				for(var j=0; j<counts[i]; j++){
					ctx.beginPath();
					ctx.arc(lMargin+i/counts.length*chartWidth,baseline - (2*j)*dotRadius*1.1, dotRadius, 0, 2 * Math.PI);
					ctx.fill();
				}
			}
		} else if (method=="line" || method=="strip"){
			var alpha=(method=="strip"?.5:.1)
			var cHex = (nPlots==1?"000000":colorHexes[labelColors[dataset-1]])
			//Set color of Fill
			if (document.getElementById("colorful").checked==true)
				ctx.fillStyle = "rgba("+hexToRgb(cHex).r +","+hexToRgb(cHex).g +","+hexToRgb(cHex).b +","+alpha+")";
			else
				ctx.fillStyle = "#C0C0C0";
			
//			ctx.fillStyle="rgba(0,0,0,"+(method=="strip"?.5:.1)+")"
			var width=(method=="strip"?Math.min(chartHeight*.25, chartHeight/nPlots - 10*scale):0)
			for(var i=0; i<n; i++){
				ctx.beginPath()
				ctx.arc(lMargin+(data[i]-allData[0])/dataRangeAll*chartWidth,yMid-+width*(Math.random()-.5),dotRadius, 0, 2 * Math.PI);
				ctx.fill()
			}
		} else if (method=="messy"){
			do{
				hiddenCTX.fillStyle="black";
				ctx.beginPath;
				ctx.fillStyle = "white";
				ctx.fillRect(0, tMargin+eachBoxHeight*(dataset-1)-dotRadius-1, c.width, eachBoxHeight+dotRadius*2+2);
				ctx.fill();
				ctx.fillStyle=colors[labelColors[dataset-1]];
				ctx.strokeStyle=colors[labelColors[dataset-1]];
				
				var tooWide=false
				var side=+1;
				
				//data = shuffle(data)
				
				for(var i=0; i<n;i++){
					var dotOffset=0;
					side=-side;
					var x=lMargin+(data[i]-allData[0])/dataRangeAll*chartWidth
					var y=tMargin+eachBoxHeight*(dataset-.5)+side*dotOffset
					
					var clearSpot = isClearSpot(hiddenCTX,x,y)
					var offsetStep = dotRadius
					if(!clearSpot){
						for(var j=0; j<2; j++){
							while((!clearSpot && j%2==0 || clearSpot && j%2==1) && dotOffset<=eachBoxHeight/2-dotRadius){
								dotOffset+=offsetStep
								y=tMargin+eachBoxHeight*(dataset-.5)+side*dotOffset
								p=hiddenCTX.getImageData(x,y,1,1).data;
								clearSpot = (p[0]+p[1]+p[2]>700)				
								if(dotOffset>eachBoxHeight/2-dotRadius) {tooWide=true; i=n; break;}
							}
							offsetStep *= -.5
						}
					}
					if(side>0) y+=1;
					drawDot(ctx, hiddenCTX, x, y, dotRadius)
				}		
				dotRadius*=.5;
			} while(tooWide)
		}
		yLabs.push(document.getElementById("name"+dataset).value)
		ctx.restore();		
	}
	chartAxisX(ctx,chartHeight+tMargin+1,lMargin,c.width-rMargin,jStat.min(data),jStat.max(data),nBins,document.getElementById('varName1').value+(document.getElementById('varUnits1').value==''?'':" ("+document.getElementById('varUnits1').value+")"),false,[],fontSizeAxis*scale)
	chartTitle(ctx,'Dot Plot',lMargin+.5*chartWidth, 0,fontSizeTitle*scale);
//	chartAxisLabelsY(ctx,yLabs,lMargin-30*scale,tMargin,eachBoxHeight,true, fontSizeAxis*scale)
//	
	chartGroupLabels(ctx, yLabs,4,tMargin+eachBoxHeight*.9, eachBoxHeight, true, fontSizeAxis*scale)

	
}

function stemMiddle(x,stem,split){
	if(x==0) return (stem/(2*split))
	else if (x<0){
		return( Math.round((x-.000000001-stem/(2*split))/(stem/split))*(stem/split)+stem/(2*split) )
	} else {
		return( Math.round((x-stem/(2*split))/(stem/split))*(stem/split)+stem/(2*split) )
	}
}

function leafValue(x,stem,leaf){
	return(Math.round(x/leaf)*leaf)
}

function stemLeafPlot(groupNames, values){
//	console.log(values)
	if (!isOpen("headerStemLeaf")) return false;
	
	var allData = [].concat(values[0]).concat(values[1])
	allData = sortArray(allData)
	var dataRange = jStat.range(allData)
		var n=allData.length	
	
//	var data=parseData(1)
//	var dataRange = jStat.range(data)
	
	
	var optimalStems=+document.getElementById('optimalStems').value
	var autoFormat = document.getElementById("autoStem").checked;
	
	if (autoFormat){
		var bestStem = .00001
		var bestSplit = 1
		var bestDiff = 99
		var bestStems = 99
		var splitChoices = [1,2,5,10];
		for(var exponent = 6; exponent>=-5; exponent--){
			for(var stemsplit = 0; stemsplit<4; stemsplit++){
				var stem = Math.pow(10, exponent)
				var leaf = stem/10
				var split = splitChoices[stemsplit]
				var lastStem = (Math.abs(allData[n-1]) - Math.abs(allData[n-1])%stem)/stem
				lastStem *= allData[n-1]/Math.abs(allData[n-1])
				var lastStemSign = allData[n-1]/Math.abs(allData[n-1])
				var currentStemMid = stemMiddle(leafValue(allData[0],stem,leaf),stem,split)
				var firstStemMid = currentStemMid
				var lastStemMid = stemMiddle(leafValue(allData[n-1],stem,leaf),stem,split)
				var nStems = Math.round((lastStemMid-firstStemMid)/(stem/split)+1)
				var diff = Math.abs(nStems-optimalStems)
				if(diff<bestDiff){
					bestStem = stem
					bestSplit = split
					bestDiff = diff
					bestStems = nStems
				}
			}
		}
		if(bestSplit == 10){
			bestStem = bestStem*.1
			bestSplit = 1;
		}
		document.getElementById('stemSize').value = bestStem;
		document.getElementById('stemsplit').value=bestSplit;
	}
	

	var stem = document.getElementById("stemSize").value
	var leaf = stem/10
	var split = document.getElementById('stemsplit').value;



	var c=document.getElementById("stemleafplot")
	var ctx=c.getContext("2d")

	var lMargin = 10
	var rMargin = 10
	var tMargin = 20
	var bMargin = 10
	var chartHeight=c.height - bMargin-tMargin
	var chartWidth=c.width - lMargin-rMargin
	var lastStem = (Math.abs(allData[n-1]) - Math.abs(allData[n-1])%stem)/stem
	lastStem *= allData[n-1]/Math.abs(allData[n-1])
	var lastStemSign = allData[n-1]/Math.abs(allData[n-1])
	var currentStemMid = stemMiddle(leafValue(allData[0],stem,leaf),stem,split)
	var firstStemMid = currentStemMid
	var lastStemMid = stemMiddle(leafValue(allData[n-1],stem,leaf),stem,split)
	var nStems = Math.round((lastStemMid-firstStemMid)/(stem/split)+1)
	var rowHeight = chartHeight/nStems
	rowHeight=18
	
	var mostLeaves=[0,0];
	var leafWidth=[0,0];
	for(var k=0; k<2; k++){
		var data=values[k]
		var n=data.length
		var nLeaves =0;
		var stemNumber=0
		for(var i=0; i<n; i++){
			var xValue = leafValue(data[i],stem,leaf)
			var lastStemNumber = stemNumber
			var stemMid = stemMiddle(xValue,stem,split)
			stemNumber = Math.round((stemMid-firstStemMid)/(stem/split))					
			if(stemNumber>lastStemNumber) nLeaves=0;
			nLeaves++;
			if (nLeaves>mostLeaves[k]) mostLeaves[k]=nLeaves
		}
		leafWidth[k] = rowHeight*.6*mostLeaves[k]		
	}

/*
	var nLeaves =0;
	var stemNumber=0
	for(var i=0; i<n; i++){
		var xValue = leafValue(data[i],stem,leaf)
		var lastStemNumber = stemNumber
		var stemMid = stemMiddle(xValue,stem,split)
		stemNumber = Math.round((stemMid-firstStemMid)/(stem/split))					
		if(stemNumber>lastStemNumber) nLeaves=0;
		nLeaves++;
		if (nLeaves>mostLeaves) mostLeaves=nLeaves
	}
	var leafWidth = rowHeight*.6*mostLeaves
//				alert(leafWidth)
	*/
	
//	var stemWidth = (2)*rowHeight*.6

	var stemWidth = 0
	ctx.font = "18px  sans-serif";
	var stemText = Math.abs(firstStemMid)/firstStemMid * Math.floor(Math.abs(firstStemMid)/stem)
	if(firstStemMid<0 && stemText==0) stemText="-0"
	stemWidth=Math.max(ctx.measureText(stemText).width,stemWidth)			
	stemText = Math.abs(lastStemMid)/lastStemMid * Math.floor(Math.abs(lastStemMid)/stem)
	if(lastStemMid<0 && stemText==0) stemText="-0"
	stemWidth=Math.max(ctx.measureText(stemText).width,stemWidth)




	c.width=490
//	if (lMargin+rMargin+stemWidth+leafWidth>490) c.width=lMargin+rMargin+stemWidth+leafWidth
	if (lMargin+rMargin+stemWidth+10+leafWidth[0]+leafWidth[1]>490){ 
		c.width=lMargin+rMargin+stemWidth+leafWidth[0]+leafWidth[1]
	} else {
		leafWidth[0]=Math.min(490-(lMargin+rMargin+stemWidth+10+leafWidth[1]),(490-lMargin-rMargin-stemWidth-10)/2)
	}

	c.height = tMargin+(nStems+2)*rowHeight
	ctx=c.getContext("2d")

	clearCanvas(ctx,c.width,c.height)

	ctx.textBaseline="top"; 
	ctx.textAlign="end"; 
	ctx.font = "12px  sans-serif";
	ctx.fillStyle = "black";
	ctx.strokeStyle = "black";
	ctx.font = Math.floor(rowHeight)+"px sans-serif";
	//alert(nStems)
	for (var i=0; i<nStems; i++){
		var stemText = Math.abs(currentStemMid)/currentStemMid * Math.floor(Math.abs(currentStemMid)/stem)
		if(currentStemMid<0 && stemText==0) stemText="-0"
		ctx.fillText(stemText, lMargin+5+stemWidth+leafWidth[0], tMargin+rowHeight*(i));
		ctx.stroke();
		currentStemMid += stem/split
	}
	ctx.beginPath();
	if(values[0].length>0){
	ctx.moveTo(lMargin+leafWidth[0]+2.5,tMargin)
	ctx.lineTo(lMargin+leafWidth[0]+2.5,tMargin+nStems*rowHeight)
	}
		ctx.moveTo(lMargin+stemWidth+7.5+leafWidth[0],tMargin)
		ctx.lineTo(lMargin+stemWidth+7.5+leafWidth[0],tMargin+nStems*rowHeight)		
	
//	ctx.moveTo(lMargin+stemWidth*(1.1),tMargin)
//	ctx.lineTo(lMargin+stemWidth*(1.1),tMargin+nStems*rowHeight)
	ctx.stroke();
	ctx.closePath();
	ctx.textAlign="start"; 
	//alert(nStems)

	ctx.fillText("Key: 1|3 = "+(1*stem+3*leaf), lMargin, tMargin+(nStems)*rowHeight)

	if(groupNames[0]!=''){
		ctx.textAlign="end";
		ctx.fillText(groupNames[0],leafWidth[0]+lMargin,0)
	}
	if(groupNames[1]!=''){
		ctx.textAlign="start";
		ctx.fillText(groupNames[1],leafWidth[0]+lMargin+10+stemWidth, 0)
	}

	for(var k=0; k<2; k++){
		data=values[k]
		var leafSpot=0
		var stemNumber = 0
		for(var i=0; i<n; i++){
			var xValue = leafValue(data[i],stem,leaf)
			var lastStemNumber = stemNumber
			var stemMid = stemMiddle(xValue,stem,split)
			stemNumber = Math.round((stemMid-firstStemMid)/(stem/split))
			if(stemNumber>lastStemNumber)leafSpot=0;
			var leafText = Math.round(Math.abs((xValue/leaf)%10))
			ctx.fillText(leafText, leafWidth[0]+lMargin+(k==1?stemWidth+7:-rowHeight*.4)+(k==0?-1:1)*rowHeight*.6*(leafSpot+.5), tMargin+rowHeight*(stemNumber));
			ctx.stroke();
			leafSpot++;
		}
	}


	/*
	var leafWidth = rowHeight*.6
	var leafSpot=0
	var stemNumber = 0
	
	for(var i=0; i<n; i++){
		var xValue = leafValue(data[i],stem,leaf)
		var lastStemNumber = stemNumber
		var stemMid = stemMiddle(xValue,stem,split)
		stemNumber = Math.round((stemMid-firstStemMid)/(stem/split))
		if(stemNumber>lastStemNumber)leafSpot=0;
		var leafText = Math.round(Math.abs((xValue/leaf)%10))
		ctx.fillText(leafText, lMargin+stemWidth+leafWidth*(leafSpot+.5), tMargin+rowHeight*(stemNumber));
		ctx.stroke();
		leafSpot++;
	}*/
	//document.getElementById("stemLeafInfo").innerHTML="Stem Size: "+stem+", leaf size: "+leaf;
}

function densityPlot(nSamples=1, canvasElmt="densityPlot", dataName=document.getElementById('name1').value, varUnits=document.getElementById('varUnits1').value, varName=exists('varName1')?document.getElementById('varName1').value:""){
	if (!isOpen("headerDensityPlot")) return false;

	var overlap = parseInt((exists('overlap')?document.getElementById('overlap').value:0))
	var c=document.getElementById(canvasElmt)
	var ctx=c.getContext("2d")
	ctx.textAlign = "center";
	ctx.font = "12px  sans-serif";
	var scale = c.width/480
	var lMargin = (overlap<=160 && nSamples>1?60:20)*scale
	var rMargin = 20*scale
	var tMargin = 25*scale
	var bMargin = 35*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin

	var allData = []
	for(var dataset=1; dataset<=nSamples; dataset++){
		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		allData = allData.concat(data)	
	}
	var allN = allData.length
	for(var i=0; i<allN; i++) { allData[i] = +allData[i]; }
	allData.sort(function(a, b){return a-b})
	var dataRangeAll = jStat.range(allData)
	var stepPrecision = Math.max(1,1+Math.round(Math.log10(2*dataRangeAll)))
	
	document.getElementById('bandwidth').max=(dataRangeAll/4.0)
	document.getElementById('bandwidth').min=(dataRangeAll/100.0)
	document.getElementById('bandwidth').step=(dataRangeAll/100.0).toPrecision(stepPrecision)
	if(document.getElementById('bandwidth').value > parseFloat(document.getElementById('bandwidth').max)){
		document.getElementById('bandwidth').value=document.getElementById('bandwidth').max
	} else if(document.getElementById('bandwidth').value < parseFloat(document.getElementById('bandwidth').min)){
		document.getElementById('bandwidth').value=document.getElementById('bandwidth').min
	}
	
	//Clear the Chart 
	clearCanvas(ctx,c.width,c.height)
	
	//Handle the X axis
	var h1;
	var fiveNumSummary = fiveNumSum(allData)
	var IQR = fiveNumSummary[3]-fiveNumSummary[1]
	var maxBW = 0
	for(var dataset=1; dataset<=nSamples; dataset++){
		var data = parseData(dataset)
		var bandwidth = autoBandwidth(data)
		maxBW=Math.max(bandwidth,maxBW)
	}
	
	if(document.getElementById('autoBandwidth').checked==true){
		document.getElementById('bandwidth').value = maxBW;
	}
	h1=document.getElementById('bandwidth').value;
	
	var hBuffer = h1*1.1
	if(document.getElementById('kernelFunction').value=='Gaussian'){
		hBuffer = h1*3
	} 

	var nBins = 10
	var h=(dataRangeAll)/nBins
	var bandwidth = chartWidth/nBins	
	chartAxisX(ctx,chartHeight+tMargin+1,lMargin,c.width-rMargin,(fiveNumSummary[0]-hBuffer),(fiveNumSummary[4]+hBuffer),nBins,varName+(varUnits==''?'':" ("+varUnits+")"),false,[], fontSizeAxis*scale)
	chartTitle(ctx,(nSamples==1?dataName+" ":"")+'Kernel Density Estimate',lMargin+.5*chartWidth, 0, fontSizeTitle*scale);
	
	ctx.strokeStyle = "#000000";

	ctx.fillStyle = "black";
	ctx.textAlign="left"
	ctx.textBaseline = "bottom"
	
	
	var opaque = exists('opaque')?document.getElementById('opaque').checked:false
	var densityHeight = (chartHeight+overlap*scale*(nSamples-1))/nSamples
	if(overlap==240) densityHeight=overlap*scale
	var groupNames=[]
	for(var dataSetNum=1; dataSetNum<=nSamples; dataSetNum++){
		groupNames.push(document.getElementById('name'+dataSetNum).value)
		var axisY = tMargin+chartHeight+1-(densityHeight-overlap*scale)*(nSamples-dataSetNum)
		data=parseData(dataSetNum)
		var n=data.length

		var resolution = 1
		step = (dataRangeAll+2*hBuffer)/(chartWidth*resolution);
		var f = []
		var i=0;
		var maxF = 0;
		for(var x=allData[0]-hBuffer; x<allData[allN-1]+hBuffer;x+=step){
			f[i]=0
			for(var j=0; j<n; j++){
				if(document.getElementById('kernelFunction').value=='Gaussian'){
					f[i]+=1/(Math.sqrt(2)*Math.PI)*Math.exp(-.5*Math.pow((data[j]-x)/h1,2))
				} else if (document.getElementById('kernelFunction').value=='Uniform'){
					f[i]+=((Math.abs(data[j]-x)/h1<1)?.5:0)
				} else if (document.getElementById('kernelFunction').value=='Triangle'){
					f[i]+=Math.max(0, 1-Math.abs(data[j]-x)/h1)
				} else if (document.getElementById('kernelFunction').value=='Epanechnikov'){
					f[i]+=Math.max(0, .75*(1-Math.pow((data[j]-x)/h1,2)))
				}
			}
			f[i]*= 1/(n*h1)
			maxF=Math.max(maxF,f[i])
			i++;
		}
		ctx.beginPath();
		
		var cHex = (nSamples==1?colorHex:colorHexes[labelColors[dataSetNum-1]])
		//Set color of Fill
		if (document.getElementById("colorful").checked==true)
			ctx.fillStyle = opaque?cHex:"rgba("+hexToRgb(cHex).r +","+hexToRgb(cHex).g +","+hexToRgb(cHex).b +",.2)";
		else
			ctx.fillStyle = "#C0C0C0";
		
		//Draw filled density curve
		
		var i=0;
		for(var x=allData[0]-hBuffer; x<allData[allN-1]+hBuffer;x+=step){
			if(i==0){
				ctx.moveTo(lMargin,axisY)
			}else{
				var d= f[i]/maxF * densityHeight;
				ctx.lineTo(lMargin+ ((x-allData[0]+hBuffer)/(dataRangeAll+2*hBuffer)) * chartWidth, axisY-d)
			}
			i++;
		}
		ctx.lineTo(lMargin+chartWidth,axisY)
		ctx.fill();	

		//Draw black density curve line
		ctx.beginPath();
		ctx.lineWidth=Math.max(1,.75*scale);
		ctx.strokeStyle = "#000000";
		i=0;
		for(var x=allData[0]-hBuffer; x<allData[allN-1]+hBuffer;x+=step){
			if(i==0) {
				ctx.moveTo(lMargin, axisY);
			}
			else {
				var d= f[i]/maxF * densityHeight;
				ctx.lineTo(lMargin+ ((x-allData[0]+hBuffer)/(dataRangeAll+2*hBuffer)) * chartWidth, axisY-d)
			}	
			i++;
		}
		ctx.stroke();
		}
		chartGroupLabels(ctx, groupNames,4,(overlap>160?15*scale:tMargin+chartHeight-10*scale-(densityHeight-overlap*scale)*(nSamples-1)),(overlap>160?15*scale:(densityHeight-overlap*scale)), false, fontSizeAxis*scale)
}

//-------------------------------------------------------
//         CATEGORICAL DATA PLOTS
//-------------------------------------------------------
function barchart(){
	data=parseQualitativeData(1)
	var n=data.length
	var c=document.getElementById("barchart")
	var ctx=c.getContext("2d")
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	var scale=c.width/480
	var pareto=(document.getElementById("pareto").checked==true);
	var propBars=(document.getElementById("propBars").checked==true);
	var lMargin = 50*scale
	var rMargin = (pareto&&!propBars?50:20)*scale
	var tMargin = 30*scale
	var bMargin = 30*scale
	var chartHeight=c.height - bMargin-tMargin
	var chartWidth=c.width - lMargin-rMargin
	
	var labels = new Array()
	var frequencies = new Array()
	
	var maxFreq = 0
	var n = data.length
	var nBars = labelOrder.length				
	for(var i=0; i<labelOrder.length;i++){
		var count=0;
		labels.push(labelOrder[i]);
		for(j=0; j<data.length; j++){
			if(data[j]==labels[i]) count++
		}
		frequencies.push(count);
		maxFreq = Math.max(maxFreq,count)
	}
	
	if(pareto){
		for(var i=0; i<nBars-1; i++){
			for(var j=i+1; j<nBars; j++){
				if(frequencies[j]>frequencies[i]){
					var tempLabel=labels[i]
					var tempFrequency=frequencies[i]
					frequencies[i]=frequencies[j]
					frequencies[j]=tempFrequency
					labels[i]=labels[j]
					labels[j]=tempLabel
				}
			}
		}
		var cprop = []
		for(var i=0; i<frequencies.length; i++){
			cprop[i] = (i==0?0:cprop[i-1])+frequencies[i]/n
		}
	}
	if(propBars){
		for(var i=0; i<labelOrder.length; i++){
			frequencies[i] /= n
		}
		maxFreq /=n
	}
	if(pareto && propBars)maxFreq=1
	
	var barGap=5
	var barchartWidth = c.width-lMargin-rMargin
	var barWidth = (barchartWidth-barGap*(nBars-1))/nBars
	var yMax = maxFreq
	var step=propBars?maxFreq/10:Math.max(1,Math.round(maxFreq/10))
	var nTicksY = yMax/step 

	//Draw axes and labels
	drawL(ctx,lMargin,lMargin+chartWidth,tMargin,tMargin+chartHeight+1)	
	chartTitle(ctx,document.getElementById('name1').value+" "+(propBars?"Proportion ":"Frequency ")+(pareto?"Pareto":"Bar")+" Chart",lMargin+.5*chartWidth, 0, fontSizeTitle*scale);
	chartAxisX(ctx,chartHeight+tMargin+1,lMargin+barWidth/2,lMargin+chartWidth-barWidth/2,0,5,labels.length,"",false,labels, fontSizeAxis*scale,true)
	chartAxisY(ctx,lMargin,tMargin+chartHeight,tMargin,0,yMax,nTicksY,(propBars?"Proportion":"Frequency"),true,lMargin+chartWidth, true, fontSizeAxis*scale)

	if(pareto){
		var y80 = tMargin+.20*chartHeight;
		ctx.beginPath()
		ctx.strokeStyle="red"
		ctx.moveTo(lMargin,y80)
		ctx.lineTo(lMargin+chartWidth,y80);
		ctx.stroke()		
	}

	//Draw Bars
	ctx.beginPath()
	ctx.strokeStyle = "black";
	ctx.fillStyle = (document.getElementById("colorful").checked==true)?colorHex:"#C0C0C0";
	var varyColors=(document.getElementById("colorfulBars").checked==true);
	for (var i=0; i<nBars; i++){
		if(varyColors) ctx.fillStyle=colors[i%colors.length]
		if(varyColors && document.getElementById("ordinal").checked==true){
			//alert(labels.toString()+ " " +labelOrder.toString())					
			ctx.fillStyle=colors[labelColors[labelOrder.indexOf(labels[i])]]
		}
		ctx.fillRect(lMargin+i*(barWidth+barGap),chartHeight+1+tMargin,barWidth,-frequencies[i]/maxFreq*chartHeight)
		ctx.strokeRect(lMargin+i*(barWidth+barGap),chartHeight+1+tMargin,barWidth,-frequencies[i]/maxFreq*chartHeight)
		ctx.stroke()
	}
	
	if(pareto){
		ctx.beginPath()
		ctx.fillStyle="black"
		for (var i=0; i<nBars; i++){
			var x=lMargin+(i+.5)*(barWidth+barGap), y=c.height-bMargin-cprop[i]*chartHeight
			if(i==0) {ctx.moveTo(x,y)} else {ctx.lineTo(x,y)}
		}
		ctx.stroke()
		for (var i=0; i<nBars; i++){
			ctx.beginPath()
			ctx.arc(lMargin+(i+.5)*(barWidth+barGap), c.height-bMargin-cprop[i]*chartHeight,2*scale,0,pi2)
			ctx.fill()
		}
		
	}
	if(pareto && !propBars){
	chartAxisY(ctx,lMargin+chartWidth,tMargin+chartHeight,tMargin,0,1,5,"Cumulative Proportion",false,lMargin+chartWidth, true, fontSizeAxis*scale,true)
	}

	
}

function piechart(){
	data=parseQualitativeData(1)
	var n=data.length
	var c=document.getElementById("piechart")
	var ctx=c.getContext("2d")
	ctx.beginPath()
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	ctx.stroke();
	ctx.closePath();
	
	var scale=c.width/480
	var lMargin = 50*scale
	var rMargin = 50*scale
	var tMargin = 70*scale
	var bMargin = 70*scale
	var chartHeight=c.height - bMargin-tMargin
	var chartWidth=c.width - lMargin-rMargin
	var radius = Math.min(chartWidth/2,chartHeight/2)
	var cX = lMargin+chartWidth/2
	var cY = tMargin+chartHeight/2
	
	
	var minSliceProportion = 0.01
	var labels = new Array()
	var frequencies = new Array()
	
	
	var maxFreq = 0
	if(n==1&&data[0]==''){
		ctx.beginPath()
		//alert(data.toString())
		ctx.fillStyle="yellow"
		ctx.arc(cX,cY,radius,0,2*Math.PI,false);
		ctx.fill()
		ctx.stroke()
		ctx.beginPath();
		ctx.closePath()
		ctx.arc(cX,cY+radius*.95,radius*.7,1.2*Math.PI,-.2*Math.PI)
		ctx.stroke()
		ctx.closePath()
		ctx.fillStyle="black"
		ctx.beginPath()
		ctx.arc(cX+radius*.4,cY-radius*.4,radius*.03,0,2*Math.PI)
		ctx.arc(cX-radius*.4,cY-radius*.4,radius*.03,0,2*Math.PI)
		ctx.fill()
	}

	var minCount = minSliceProportion * n;
	var otherCount = 0;
	var otherLabels = new Array();
	var otherFrequencies = new Array();
	//alert(labelOrder.toString())
	var nBars = labelOrder.length				
	for(var i=0; i<labelOrder.length;i++){
		var count=0;
		for(j=0; j<data.length; j++){
			if(data[j]==labelOrder[i]) count++
		}
		if(count>minCount){
			labels.push(labelOrder[i]);
			frequencies.push(count);
		} else {
			otherLabels.push(labelOrder[i]);
			otherFrequencies.push(count);
			otherCount+=count;
		}
		maxFreq = Math.max(maxFreq,count)
	}
	
	var orderSlicesFreq=(document.getElementById("orderSlicesFreq").checked==true);
	if(orderSlicesFreq){
		for(var i=0; i<labels.length-1; i++){
			for(var j=i+1; j<labels.length; j++){
				if(frequencies[j]>frequencies[i]){
					var tempLabel=labels[i]
					var tempFrequency=frequencies[i]
					frequencies[i]=frequencies[j]
					frequencies[j]=tempFrequency
					labels[i]=labels[j]
					labels[j]=tempLabel
				}
			}
		}
	
	}
	if(otherCount>0){
		labels.push("Other");
		frequencies.push(otherCount);
	}
	nBars = labels.length
	//alert(labels.toString() + " " + frequencies.toString());

	
	if (document.getElementById("colorful").checked==true)
		ctx.fillStyle = colorHex;
	else
		ctx.fillStyle = "#C0C0C0";

	var varyColors=(document.getElementById("colorfulBars").checked==true);
	varyColors=true;
	var startingAngle = 1.5*Math.PI
	for (var i=0; i<nBars; i++){
		var proportion = frequencies[i]/n
		var angle = proportion * 2*Math.PI
		ctx.beginPath()
		ctx.moveTo(cX,cY)
		ctx.fillStyle=colors[i%colors.length]
		if(i==nBars-1 && i%colors.length==0) ctx.fillStyle=colors[4]
		if(document.getElementById("ordinal").checked==true) {
			if(labels[i]=="Other"){
				ctx.fillStyle='gray';
			} else {
				ctx.fillStyle=colors[labelColors[labelOrder.indexOf(labels[i])]]
			}
		}
		ctx.arc(cX,cY,radius,startingAngle, startingAngle+angle)
		ctx.fill()
		ctx.stroke()
		ctx.closePath()
		startingAngle+=angle
	}	
	
	ctx.font = (12*scale)+"px  sans-serif";
	ctx.fillStyle = "black";
	
	startingAngle = -.5*Math.PI
	ctx.textAlign="left"
	ctx.textBaseline="middle";
	var tickH=1
	var tickLength=5
	var lineHeight=12*scale;
	var nSmallSlices=0
	if(orderSlicesFreq){
		for(var i=0; i<frequencies.length; i++) if(frequencies[i]< .05 * n) nSmallSlices++;		
	}
	var smallSliceCount=0;
	var stagger=0;
	for(var i=0; i<nBars; i++){
		var proportion = frequencies[i]/n
		var angle = proportion * 2*Math.PI
		ctx.beginPath()
		var tickAngle=startingAngle+angle/2
		if(tickAngle>.5*Math.PI){ 
			ctx.textAlign="right"
			tickH=-1
		} else {
			ctx.textAlign="left"
			tickH=+1
		}
		var tX,tY,pointerX,pointerY
		var twolines=false
		if(proportion<.1){
			ctx.textBaseline="middle";
			ctx.fillStyle = "black";
			ctx.moveTo(cX+(radius+4)*Math.cos(tickAngle), cY+(radius+4)*Math.sin(tickAngle))
			if(proportion<.1){
				tickLength=10*(Math.tan(tickAngle)<0?5-stagger:stagger+1)*scale
				if(Math.tan(tickAngle) < .5 && Math.tan(tickAngle)>-.5) tickLength= 40*scale
				stagger= (stagger+1)%4
				
				smallSliceCount++						
				pointerX=cX+(radius+4+tickLength)*Math.cos(tickAngle)
				pointerY=cY+(radius+4+tickLength)*Math.sin(tickAngle)
//							tX = cX+(radius+4+tickLength)*Math.cos(tickAngle)+tickH*62;
//							tY=20 +(nSmallSlices-smallSliceCount)*lineHeight
tX=pointerX
tY=pointerY
				ctx.textAlign="center"
			} else {
				tickLength = 10
				pointerX=cX+(radius+4+tickLength)*Math.cos(tickAngle)
				pointerY=cY+(radius+4+tickLength)*Math.sin(tickAngle)
				tX=cX+(radius+4+tickLength)*Math.cos(tickAngle)+tickH*12
				tY=cY+(radius+4+tickLength)*Math.sin(tickAngle)
			}
			ctx.lineTo(pointerX, pointerY)
			ctx.lineTo(tX-tickH*(2),tY)
			ctx.stroke()
			ctx.closePath()
			ctx.beginPath()
			var label = labels[i]+" "+(frequencies[i]/n*100).toFixed(0)+"%"
			ctx.fillStyle="white"
			ctx.fillRect(tX-ctx.measureText(label).width/2, tY-lineHeight/2,ctx.measureText(label).width,lineHeight)
			ctx.fill();
			ctx.closePath();
			ctx.beginPath();
			ctx.fillStyle="black"
			ctx.fillText(label,tX,tY );
		} else {
			twolines=true
			ctx.textAlign="center";
			var slicecolor=colors[i%colors.length]
			if(i==nBars-1 && i%colors.length==0) slicecolor=colors[4]
			if(document.getElementById("ordinal").checked==true){ 
				if(labels[i]=="Other"){
					slicecolor='gray';
				} else {
					slicecolor=colors[labelColors[labelOrder.indexOf(labels[i])]]
				}
			}
			var colorRGBA=colorToRGBA(slicecolor)
			if(colorRGBA[0]+colorRGBA[1]+.75*colorRGBA[2]<250){
				ctx.fillStyle = "white";
			} else {
				ctx.fillStyle = "black";
			}
			tX=cX+(radius*.6)*Math.cos(tickAngle)
			tY=cY+(radius*.6)*Math.sin(tickAngle)
			ctx.fillText(labels[i],tX,tY-lineHeight/2 );
			ctx.fillText((frequencies[i]/n*100).toFixed(0)+"%",tX,tY+lineHeight/2 );
		}
		ctx.stroke()
		ctx.closePath()
		startingAngle+=angle
	}
	
	chartTitle(ctx,document.getElementById('name1').value+" Pie Chart",lMargin+.5*chartWidth, 0, fontSizeTitle*scale);

}			

function mosaicPlot(){
	var nRows = parseInt(document.getElementById('nRows').value)
	var nCols = parseInt(document.getElementById('nCols').value)
	var c=document.getElementById("mosaicPlot")
	var ctx=c.getContext("2d")
	var scale = c.width/490
	ctx.textAlign = "center";
	ctx.font = (12*scale)+"px  sans-serif";
	var lMargin = 30*scale
	var rMargin = 5*scale
	var tMargin = 5*scale
	var bMargin = 30*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin

	var colors=customColors.slice()

	clearCanvas(ctx,c.width, c.height)
	var gap = 5
	
	var colSum = []
	var total = 0
	for (var col=1; col<=nCols; col++){
		colSum[col-1]=0
		for(var row = 1; row <=nRows; row++){
			colSum[col-1]+=parseFloat(document.getElementById('r'+row+'c'+col).value)
		}
		total += colSum[col-1]
	}
	ctx.strokeStyle="black"
	ctx.textAlign = "center";
	var startAt = 0
	for (var col=1; col<=nCols; col++){
		var width = colSum[col-1]/total*(chartWidth-(nCols-1)*gap)
		var heightStart = 0
		for(var row = 1; row <=nRows; row++){
			var height = parseFloat(document.getElementById('r'+row+'c'+col).value)/colSum[col-1]*(chartHeight-(nRows-1)*gap)	

			ctx.fillStyle=colors[(row-1)%10]
			ctx.fillRect(lMargin+startAt,tMargin+heightStart,width,height)
			ctx.fill()
			ctx.strokeRect(lMargin+startAt,tMargin+heightStart,width,height)
			ctx.stroke()
			
			if(col==1){
				//Row label
				ctx.fillStyle="black"
				ctx.save();
				ctx.translate(lMargin*.67, tMargin+heightStart+height*.5);
				ctx.rotate(-Math.PI/2);
				ctx.fillText(document.getElementById('rowHead'+row).value, 0, 0);
				ctx.restore();
			}

			heightStart += height + gap
		}
		
		//Column label
		ctx.fillStyle="black"
		ctx.fillText(document.getElementById('colHead'+col).value, lMargin+startAt+.5*width, tMargin+chartHeight+12*scale);
		startAt += width + gap
	}
	
	ctx.fillStyle="black"
	ctx.save();
	ctx.translate(lMargin*.33, tMargin+chartHeight*.5);
	ctx.rotate(-Math.PI/2);
	ctx.fillText(document.getElementById('rowVarName').value, 0, 0);
	ctx.restore();
	
	ctx.fillText(document.getElementById('colVarName').value, lMargin+chartWidth/2, tMargin+chartHeight+25*scale);

}

function barCharts(){
	var nRows = parseInt(document.getElementById('nRows').value)
	var nCols = parseInt(document.getElementById('nCols').value)
	var stacked = (document.getElementById("stacked").checked==true);
	var proportions = (document.getElementById("proportions").checked==true);
	var legend = (document.getElementById("barLegend").checked==true);
	var c=document.getElementById("barCharts")
	var ctx=c.getContext("2d")
	var colors=customColors.slice()
	ctx.textAlign = "center";
	ctx.font = "12px  sans-serif";
	clearCanvas(ctx,c.width, c.height)
	var scale=c.width/490
	var lMargin = 50*scale
	var rMargin = (legend?100:5)*scale
	var tMargin = 10*scale
	var bMargin = 35*scale
	var legendWidth = (legend?100:0)*scale
	if(legend){
		labels=[]
		for(var i=1; i<=nRows; i++){
			labels.push(document.getElementById('rowHead'+i).value)	
		}
		legendWidth=makeLegend(ctx,c.width,tMargin-5,labels,"white","squares",true,fontSizeAxis*scale, document.getElementById('rowVarName').value)
	}
	rMargin=legendWidth


	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin

	var mainGap = 12
	var subGap = 0
	var legendWidth=100

	ctx.strokeStyle="black"

	var maxFreq = 0
	var colSum = []
	var total = 0
	for (var col=1; col<=nCols; col++){
		colSum[col-1]=0
		for(var row = 1; row <=nRows; row++){
			var cellFreq = parseFloat(document.getElementById('r'+row+'c'+col).value)
			colSum[col-1]+=cellFreq
			if (!stacked && cellFreq > maxFreq) maxFreq = cellFreq
		}
		total += colSum[col-1]
		if(stacked && colSum[col-1]>maxFreq) maxFreq = colSum[col-1]
	}

	
	var maxProp = 0
	if(stacked==true) {maxProp=1.0;} 
	else {
		for(var col=1; col<=nCols; col++){
			for(var row = 1; row <=nRows; row++){
				var cellFreq = parseFloat(document.getElementById('r'+row+'c'+col).value)
				if ((cellFreq/colSum[col-1])>maxProp) maxProp = cellFreq/colSum[col-1]
			}
		}
	}
	
	var labels=[]
	for(var i=1; i<=nCols; i++){
		labels.push(document.getElementById('colHead'+i).value)	
	}

	var barWidth = (chartWidth-(nCols+1)*mainGap)/(nCols)
		
	//Draw axes and labels
	drawL(ctx,lMargin,lMargin+chartWidth,tMargin,tMargin+chartHeight+1)	
//	chartTitle(ctx,document.getElementById('name1').value+" "+(propBars?"Proportion ":"Frequency ")+(pareto?"Pareto":"Bar")+" Chart",lMargin+.5*chartWidth, 0, fontSizeTitle*scale);
	chartAxisX(ctx,chartHeight+tMargin+1,lMargin+mainGap+barWidth/2,lMargin+chartWidth-mainGap-barWidth/2,0,5,labels.length,document.getElementById('colVarName').value,false,labels, fontSizeAxis*scale)


	var maxYVal = (proportions?maxProp:maxFreq)	
	var step=proportions?maxYVal/10:Math.max(1,Math.round(maxYVal/10))
	var nTicksY = maxYVal/step 


	chartAxisY(ctx,lMargin,tMargin+chartHeight,tMargin,0,maxYVal,nTicksY,(proportions?"Proportion":"Frequency"),true,lMargin+chartWidth, true, fontSizeAxis*scale)


	//Vertical Axis
/*	ctx.fillStyle="black"
	ctx.strokeStyle="black"
	
	ctx.beginPath();
	ctx.moveTo(lMargin,tMargin+chartHeight+1)
	ctx.lineTo(lMargin,tMargin)
	ctx.stroke();
	
	ctx.textAlign="end"; 
	ctx.textBaseline="middle"; 

	for (var j =0; j<=maxYVal; j++) {
		var i=j * (proportions?.01:1)
		if(j % Math.max(1,Math.round(maxYVal/10)) == 0){
			var y=tMargin+chartHeight+1 - chartHeight*(j/maxYVal)
			ctx.strokeStyle = "#C0C0C0";
			ctx.beginPath();
			ctx.moveTo(lMargin,y)
			ctx.lineTo(lMargin+chartWidth,y)
			ctx.stroke()
			
			ctx.strokeStyle = "black";
			ctx.beginPath();
			ctx.moveTo(lMargin,y)
			ctx.lineTo(lMargin-5,y)
			var labelText = i
			if(proportions) labelText = i.toFixed(2)
			ctx.fillText(labelText, lMargin-6, y);
			ctx.stroke()
		}
	}
	
	
	ctx.save();
	ctx.translate(lMargin-40, tMargin+.5*chartHeight);
	ctx.rotate(-Math.PI/2);
	ctx.textAlign = "center";
	ctx.fillText((proportions?"Proportion":"Frequency"), 0, 0);
	ctx.restore();
	*/
	//Horizontal Axis
/*	ctx.textAlign = "center";
	ctx.beginPath();
	ctx.moveTo(lMargin,tMargin+chartHeight+1);
	ctx.lineTo(lMargin+chartWidth,tMargin+chartHeight+1);
	ctx.stroke();	
	ctx.fillText(document.getElementById('colVarName').value, lMargin+.5*chartWidth, tMargin+chartHeight+30)
	*/

	var startAt = mainGap
	for (var col=1; col<=nCols; col++){
		var width = ((chartWidth-(nCols+1)*mainGap - (nCols)*(nRows-1)*subGap*(stacked==true?0:1))/(nCols*(stacked==true?1:nRows)))
		var heightStart = 0
		//Column label
//		ctx.fillStyle="black"
//		ctx.fillText(document.getElementById('colHead'+col).value, lMargin+startAt+.5*(width*(stacked?1:nRows)+(stacked?0:(subGap*(nRows-1)))), tMargin+chartHeight+15);
		for(var j = 1; j <=nRows; j++){
			var row = (stacked?nRows-j+1:j)
			var height = parseFloat(document.getElementById('r'+row+'c'+col).value)/(proportions?colSum[col-1]*maxProp:maxFreq)*chartHeight	
			ctx.fillStyle=colors[(row-1)%colors.length]
			ctx.fillRect(lMargin+startAt,tMargin+chartHeight-heightStart,width,-height)
			ctx.fill()
			ctx.strokeRect(lMargin+startAt,tMargin+chartHeight-heightStart,width,-height)
			ctx.stroke()
			
			if(stacked){ 
				heightStart += height
			} else {
				startAt += width + subGap
				if (row==nRows) startAt -= subGap
			}
		}
		startAt += (stacked?width:0) + mainGap
	}




}

//-------------------------------------------------------
//        TIME SERIES RELATED PLOTS
//-------------------------------------------------------
function drawACF(set, canvasID, partial=false){
	var c=document.getElementById(canvasID)
	var ctx=c.getContext("2d")
	ctx.textAlign = "center";
	ctx.font = "12px  sans-serif";
	var scale=c.width/490
	var lMargin = 50*scale
	var rMargin = 20*scale
	var tMargin = 20*scale
	var bMargin = 35*scale
	var chartMargin = 5*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	
	var maxAC = 1
//	if(maxAC<0) maxAC=0
	var minAC = (partial?jStat.min(PACF):jStat.min(ACF))
	if(minAC>0) minAC=0
	minAC = Math.min(minAC, -2/Math.sqrt(transformedData.length))

	var n=(partial?PACF.length:ACF.length);
	
	ctx.beginPath;
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	ctx.fill();			
	
	ctx.fillStyle = "#000000";	
	ctx.strokeStyle = "#000000";
	
	//draw axes
	//ctx.beginPath();
	//ctx.moveTo(lMargin,tMargin);
	//ctx.lineTo(lMargin,tMargin+chartHeight);
	//ctx.lineTo(c.width-rMargin,tMargin+chartHeight +1);
	//ctx.stroke();
	drawL(ctx,lMargin, c.width-rMargin, tMargin, tMargin+chartHeight+1)
	
	var y0 = tMargin+chartMargin+maxAC/(maxAC-minAC)*(chartHeight-2*chartMargin)
	ctx.beginPath();
	ctx.moveTo(lMargin,y0)
	ctx.lineTo(c.width-rMargin,y0);
	ctx.stroke();
	
	var barWidth = (chartWidth-chartMargin*2)/(n)
	chartAxisX(ctx,tMargin+chartHeight+1,lMargin+chartMargin+barWidth/2,lMargin+chartWidth-chartMargin-barWidth/2,0,n-1,Math.min(n-1,50),"Lag",false,[],fontSizeAxis*scale)
	chartAxisY(ctx,lMargin,tMargin+chartHeight-chartMargin,tMargin+chartMargin,minAC,maxAC,10,(partial?"P":"")+"ACF",true, c.width-rMargin,true,fontSizeAxis*scale)
	chartTitle(ctx,(partial?"Partial ":"")+"Autocorrelation Function Plot",c.width/2,0,fontSizeTitle*scale);

	ctx.rect(lMargin,tMargin,chartWidth,chartHeight)
	ctx.clip();

	ctx.strokeStyle="red"
	ctx.setLineDash([5, 3])	
	for(var lineScalar=-1; lineScalar<=1; lineScalar+=2){
		var crit = lineScalar*1.96/Math.sqrt(transformedData.length)
		if(crit>minAC){
			ctx.beginPath()
			var varacf = 0
			for(var i=0; i<=n; i++){
				if(i==1 || partial) {
					varacf = 1/transformedData.length
				} else if(i>=2){
					varacf=0
					for(var k=1; k<i; k++) varacf += Math.pow(partial?PACF[k]:ACF[k],2)
					varacf = 1/transformedData.length * (1 + 2*varacf)
				}
				var critHeight = lineScalar*1.96*Math.sqrt(varacf)
				///Math.sqrt(transformedData.length-i)
				var y=c.height-bMargin-chartMargin-(critHeight-minAC)/(maxAC-minAC)*(chartHeight-2*chartMargin)
				var x=1+chartMargin+lMargin+(i+.5)*barWidth
				if(i!=0) ctx.lineTo(x, y); else ctx.moveTo(x,y);
			}
			ctx.stroke()
		}
	}
	ctx.restore()
	
	ctx.strokeStyle="black"
	ctx.setLineDash([1,0])
	
	if (document.getElementById("colorful").checked==true)
		ctx.fillStyle = colorHex;
	else
		ctx.fillStyle = "#C0C0C0";

	ctx.beginPath();
	for(var i=0; i<n; i++){
		ctx.beginPath();
		var barHeight=((partial?PACF[i]:ACF[i]))/(maxAC-minAC)*(chartHeight-2*chartMargin)
		var y1 = y0
		if(barHeight>0){
			y1 = y0-Math.abs(barHeight)
		}
		barHeight = Math.abs(barHeight)
		
		ctx.fillRect(1+chartMargin+lMargin+(i+.25)*barWidth, y1, barWidth/2-1,barHeight)
		ctx.strokeRect(1+chartMargin+lMargin+(i+.25)*barWidth, y1, barWidth/2-1,barHeight)
		ctx.stroke();
	}
}

function drawTimeSeriesPlot(set, canvasID, transformed=true){
	var c=document.getElementById(canvasID)
	var ctx=c.getContext("2d")
	ctx.textAlign = "center";
	ctx.font = "12px  sans-serif";
	var scale=c.width/490
	var lMargin = 50*scale
	var rMargin = 20*scale
	var tMargin = 20*scale
	var bMargin = 30*scale
	var chartMargin = 5*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	
	var data = (transformed?transformedData:document.getElementById("data"+set).value.split(/[\s,;\t\n]+/))
	var n=data.length
	var firstValue = transFirstIndex;
	if(!transformed){
		for(var i=0; i<n; i++) data[i]=+data[i]
		firstValue = 0
	}
	
	var dataMin = jStat.min(transformed?transformedData:data)
	var dataMax = jStat.max(transformed?transformedData:data)

	var allModels = document.getElementsByClassName("model");
	for (var modelNum=0; modelNum<allModels.length; modelNum++){
		var modelIndex = allModels[modelNum].id
		modelIndex = modelIndex.substring(5)
		if(modelReady[modelIndex]){
			var yVals = []
			if(transformed){
				yVals = modelSeries[modelIndex]
			} else {
				var result = reverseTransformations(modelSeries[modelIndex], modelT0[modelIndex]);
				yVals = result.tSeries
			}
			dataMin=Math.min(dataMin, Math.min.apply(Math,yVals))
			dataMax=Math.max(dataMax, Math.max.apply(Math,yVals))
		}
	}

	
	
	ctx.beginPath;
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	ctx.fill();			
	
	ctx.fillStyle = "#000000";	
	ctx.strokeStyle = "#000000";
	//draw axes
//	ctx.beginPath();
//	ctx.moveTo(lMargin,tMargin);
//	ctx.lineTo(lMargin,tMargin+chartHeight);
//	ctx.lineTo(c.width-rMargin,tMargin+chartHeight +1);
//	ctx.stroke();
//	drawL(ctx,lMargin, lMargin+chartWidth, tMargin, tMargin+chartHeight+1)
	
//	alert(dataMin + " " +data[0] + " " + dataMax)
	chartAxisX(ctx,tMargin+chartHeight+1,lMargin+chartMargin,lMargin+chartWidth-chartMargin,1,n+firstValue+1,Math.min(n+firstValue,50),timeAxisLabel,false, timeLabels,fontSizeAxis*scale)
	chartAxisY(ctx,lMargin,tMargin+chartHeight-chartMargin,tMargin+chartMargin,dataMin,dataMax,10,document.getElementById('name1').value+(document.getElementById('varUnits1').value==''?'':" ("+document.getElementById('varUnits1').value+")"),true, c.width-rMargin,true,fontSizeAxis*scale)
//	chartAxisY(ctx,lMargin,tMargin+chartHeight-chartMargin,tMargin+chartMargin,5,25,10,"Value",true, c.width-rMargin)
	chartTitle(ctx,"Time Series Plot",c.width/2,0,fontSizeTitle*scale);
	
	setChartParams(0,n,dataMin,dataMax, chartWidth-2*chartMargin,chartHeight-2*chartMargin,lMargin+chartMargin,tMargin+chartMargin)
	
	var drawDots = true;
	var drawLine = document.getElementById("connectPoints").checked;
	var subtle = exists("subtlePoints") && document.getElementById("subtlePoints").checked;
	ctx.save();
	ctx.beginPath();
	ctx.rect(lMargin,tMargin,chartWidth,chartHeight)
	ctx.clip();
	
	var activeTransformations = false
	for(i=0; i<transformationReady.length; i++)
		if(transformationReady[i]) activeTransformations= true;
	if(!transformed && activeTransformations){
//		console.log("Plotting Trend")
//		console.log(fit)
		var result = reverseTransformations(fit, 0, false)
		var unTransformedTrend = result.tSeries
//		console.log(unTransformedTrend)
		ctx.beginPath();
		ctx.setLineDash([5, 3]);
		ctx.strokeStyle="red";
//		for(var i=0; i<transformedData.length; i++){
//			var x = lMargin + chartMargin + (chartWidth-2*chartMargin)/(n)*(i+transFirstIndex)
//			var y = tMargin + chartMargin + (1.0 -((unTransformedTrend[i])-dataMin)/(dataMax-dataMin)) * (chartHeight-2*chartMargin)
//			if(i==0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
//		}
		for(var i=0; i<fit.length; i++){
			if(i==0) ctx.moveTo(tx(i),ty(fit[i])); else ctx.lineTo(tx(i),ty(fit[i]));
		}
		ctx.stroke();
		ctx.setLineDash([1, 0]);
	}
	
//	console.log("n="+n)
	
	//Draw Data Points
	if(drawLine){
		ctx.beginPath();
		ctx.strokeStyle=subtle?'#DDD':'black'
		for(var i=0; i<n; i++){
//			var x = lMargin + chartMargin + (chartWidth-2*chartMargin)/(n+firstValue)*(i+firstValue)
//			var y = tMargin + chartMargin + (1.0 -(data[i]-dataMin)/(dataMax-dataMin)) * (chartHeight-2*chartMargin)
			if(i==0) ctx.moveTo(tx(i+firstValue),ty(data[i])); else ctx.lineTo(tx(i+firstValue),ty(data[i]))
		}		
		ctx.stroke();
	}
	if(drawDots) {
		var dotRadius=subtle?.25:2
		ctx.fillStyle=subtle?'#DDD':'black'
		for(var i=0; i<n; i++){
//			var x = lMargin + chartMargin + (chartWidth-2*chartMargin)/(n+firstValue)*(i+firstValue)
//			var y = tMargin + chartMargin + (1.0 -(data[i]-dataMin)/(dataMax-dataMin)) * (chartHeight-2*chartMargin)
			ctx.beginPath();
			ctx.arc(tx(i+firstValue),ty(data[i]), 2*scale, 0, 2 * Math.PI);
			ctx.fill();
		}
	}
	
//	var allModels = document.getElementsByClassName("model");
		//var result = reverseTransformations(fit, 0, false)
		//var unTransformedTrend = result.tSeries


	for (var modelNum=0; modelNum<allModels.length; modelNum++){
		var modelIndex = allModels[modelNum].id
		modelIndex = modelIndex.substring(5)
		if(modelReady[modelIndex]){
			ctx.strokeStyle = colors[modelColors[modelIndex]]
			var modelType = document.getElementById("modelType"+modelIndex).value;
			var yVals = []
			var t0 = modelT0[modelIndex]
			if(transformed){
				yVals = modelSeries[modelIndex]
			} else {
				console.log("reverse model values")
				var result = reverseTransformations(modelSeries[modelIndex], modelT0[modelIndex]);
//				yVals = result.tSeries
				t0=result.T0
				
				for(var i=0; i<modelSeries[modelIndex].length; i++){
					yVals[i]=fit[i+t0]+modelSeries[modelIndex][i]
				}
//				console.log(modelSeries[modelIndex])
//				console.log(yVals)
				
			}
			ctx.beginPath();
			for(var i=0; i<yVals.length; i++){
				var x = tx(i+t0+firstValue) //lMargin + chartMargin + (chartWidth-2*chartMargin)/(n+firstValue)*(i+t0+firstValue)
				var y = ty(yVals[i]) //tMargin + chartMargin + (1.0 -(yVals[i]-dataMin)/(dataMax-dataMin)) * (chartHeight-2*chartMargin)	
				if(i==0){
					ctx.moveTo(x,y)
				} else {
					ctx.lineTo(x,y);
				}		
			}		
			ctx.stroke();
		}
	}
	ctx.restore();
}

//--------------------------------------------------------
//          SPATIAL ANALYSIS PLOTS
//--------------------------------------------------------
function drawShape(polyVector,ctx, fillShape=false, fillcolor="white"){
	ctx.strokeStyle="black"
	ctx.fillStyle=fillcolor
	for(var i=0; i<polyVector.length; i++){
		ctx.beginPath()
		for(var j=0; j<polyVector[i].length; j++){
			coords=tpt(polyVector[i][j][0],polyVector[i][j][1])
			if(j==0){
			ctx.moveTo(coords[0],coords[1]) 
			} else {
			ctx.lineTo(coords[0],coords[1]) 				
			}
		}
		if(fillShape) ctx.fill()
		ctx.stroke()			
	}
}

function interpolate(x,y,data,interp){
	var v=0
	var n=data[0].length

	if(interp==1){
		var N = +document.getElementById('idwN').value
		if(N=='') N=data[0].length
		var pwr = +document.getElementById('idwPower').value
		var dist=[]
		var vals=[]
		for(var k=0; k<n; k++){
			
			dist.push(Math.max(.00000001,distance(x,y,data[0][k],data[1][k])))
			//Math.sqrt(Math.pow(x-data[0][k],2)+Math.pow(y-data[1][k],2))))
			vals.push(data[2][k])
		}
		for(si=0; si<n-1; si++){
			for(sj=si+1; sj<n; sj++){
				if(dist[si]>dist[sj]){
					var tdist=dist[si], tval=vals[si]
					dist[si]=dist[sj]
					dist[sj]=tdist
					vals[si]=vals[sj]
					vals[sj]=tval
				}
			}
		}
//				if(i==0&&j==0) console.log(dist)
		var w=[], wSum=0
		for(var k=0; k<N && k<n; k++){
			var newW=(1/Math.pow(dist[k],pwr))
			w.push(newW)
			wSum+=newW
		}
		for(var k=0; k<N && k<n; k++){
			v+=vals[k]*w[k]/wSum
		}
	}		

	return v
}

function spatialPlot(data, canvasElmt='spatialPlot', raster=false){
	if(debug) console.log("drawing Spatial Plot")
//	var kriging = require('kriging');
	if(dataEntryChoice==2) raster=true
	var c=document.getElementById(canvasElmt)
	var ctx=c.getContext("2d")
	var scale=c.width/490
//	console.log(scale)
	var legend=true
	var tMargin=20*scale, rMargin=10*scale, lMargin=50*scale, bMargin=(legend?60:30)*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	var plotMargin =.10
	var xRng=[+jStat.min(data[0]),+jStat.max(data[0])]
	var yRng=[+jStat.min(data[1]),+jStat.max(data[1])]
	xRng=[+xRng[0]-plotMargin*(xRng[1]-xRng[0]),+xRng[1]+plotMargin*(xRng[1]-xRng[0])]
	yRng=[+yRng[0]-plotMargin*(yRng[1]-yRng[0]),yRng[1]+plotMargin*(yRng[1]-yRng[0])]
	var vRng=[]
	var pointsOnly=data.length==2 && raster==false
	
	var dataVals = (pointsOnly?[]:data[2].slice().sort(function(a, b){return a-b}))
	for(var i=0; i<dataVals.length; i++) { dataVals[i] = +dataVals[i]; }
//	console.log(dataVals)
	if(data.length==3 && raster==false) vRng=[+jStat.min(dataVals),+jStat.max(dataVals)]
	var varCat = document.getElementById('varType').value==1

//	console.log(vRng)
	
	if(raster){
		xRng=[0-.5,data[0].length-.5]
		yRng=[data.length-.5,0-.5]
//		if(document.getElementById("XRng0").value=="") console.log("Xrng undefinded")
		vRng=[Infinity,-Infinity]
		for(var i=0; i<data.length; i++){
			for(var j=0; j<data[i].length; j++){
				if(!isNaN(data[i][j])){
					vRng[0]=Math.min(vRng[0],data[i][j])
					vRng[1]=Math.max(vRng[1],data[i][j])
				}
			}	
		}	
	}
	var makeSquare=true
	if(makeSquare){
		var unitWidth = distance(xRng[0],(yRng[0]+yRng[1])/2, xRng[1],(yRng[0]+yRng[1])/2)
		var unitHeight = distance((xRng[0]+xRng[1])/2, yRng[0],(xRng[0]+xRng[1])/2, yRng[1])
//		if(unitHeight/unitWidth > chartHeight/chartWidth){
		c.height=tMargin+bMargin+chartHeight*(unitHeight/unitWidth)/(chartHeight/chartWidth)
		chartHeight = c.height-tMargin-bMargin
//		} else {
//			c.width=lMargin+rMargin+chartWidth*(chartHeight/chartWidth)/(unitHeight/unitWidth)
//			chartWidth = c.height-tMargin-bMargin
//		
//		}
		
	}
	
	spatialPlotParameters = [xRng[0],xRng[1],yRng[0],yRng[1],chartWidth,chartHeight,lMargin,tMargin]
	setChartParams(xRng[0],xRng[1],yRng[0],yRng[1],chartWidth,chartHeight,lMargin,tMargin)
	
	ctx.beginPath()
	ctx.fillStyle="white"
	ctx.fillRect(0,0,c.width, c.height)
	ctx.fill()
	
	var cRamp =+document.getElementById('colorRampChoice').value
	var gridRes = +document.getElementById('spatialRes').value
	var n=data[0].length
	var m=(dataEntryChoice==2?data.length:1)
	var interp = +document.getElementById('spatialInterp').value
	var vs=[]
	ctx.save();
	ctx.beginPath();
	ctx.rect(lMargin,tMargin,chartWidth,chartHeight)
	ctx.clip();
	
	if(!pointsOnly && !raster){
		if(interp==1){
			for(var i=0; i<chartWidth/gridRes; i++){
				for(var j=0; j<chartHeight/gridRes; j++){
					x= (i+.5)/(chartWidth/gridRes)*(xRng[1]-xRng[0])+xRng[0]
					y= (j+.5)/(chartHeight/gridRes)*(yRng[1]-yRng[0])+yRng[0]
					var v=interpolate(x,y,data,interp)
	//				if(i==0&&j==0) console.log(w)
	//				console.log(i+" "+j+ " "+v)
					var color=colorRamp(cRamp, (v-vRng[0])/(vRng[1]-vRng[0]))
					
					ctx.beginPath()
					ctx.fillStyle = color
					ctx.fillRect(lMargin+i*gridRes, tMargin+chartHeight-j*gridRes,gridRes+1,-gridRes-1)
					ctx.fill()
					
				}
			}
			predictedValue = interpolate(predictPoint[0],predictPoint[1],data,1)
			
		} else if (interp==2){
			var model = document.getElementById('krigingModel').value;
			var sigma2 = 0, alpha = 100;
			var fitModel = kriging.train(data[2], data[0], data[1], model, sigma2, alpha);
//			console.log("variogram ="+fitModel)
//			console.log("nugget ="+fitModel.nugget)
//			console.log("range ="+fitModel.range)
//			console.log("sill ="+fitModel.sill)
			
			var minV = Infinity
			var maxV = -Infinity
			
			for(var i=0; i<chartWidth/gridRes; i++){
				vs[i]=[]
				for(var j=0; j<chartHeight/gridRes; j++){
					x= (i+.5)/(chartWidth/gridRes)*(xRng[1]-xRng[0])+xRng[0]
					y= (j+.5)/(chartHeight/gridRes)*(yRng[1]-yRng[0])+yRng[0]
					var v=kriging.predict(x,y,fitModel)
					vs[i][j]=v
					
					minV=Math.min(v,minV)
					maxV=Math.max(v,maxV)
				}
			}
			predictedValue = kriging.predict(predictPoint[0],predictPoint[1],fitModel)
			
			for(var i=0; i<chartWidth/gridRes; i++){
				for(var j=0; j<chartHeight/gridRes; j++){
					var colorAlpha = Math.min(1,Math.max(0,(vs[i][j]-vRng[0])/(vRng[1]-vRng[0])))
					var color=colorRamp(cRamp, colorAlpha)
					ctx.beginPath()
					ctx.fillStyle = color
					ctx.fillRect(lMargin+i*gridRes, tMargin+chartHeight-j*gridRes,gridRes+1,-gridRes-1)
					ctx.fill()
				}
			}
		} else if (interp==4){
			//console.log("linear trend")
			var X=[]
			var ones=filledArray(data[0].length, 1)
			X.push(ones)
			X.push(data[0].slice())
			X.push(data[1].slice())
			X = numeric.transpose(X)
			var Y=data[2].slice()
			var XXTinv = pinv(numeric.dot(numeric.transpose(X),X))
			var b = numeric.dot(XXTinv,numeric.dot(numeric.transpose(X),Y) )			
		//	console.log(b)
			for(var i=0; i<chartWidth/gridRes; i++){
				for(var j=0; j<chartHeight/gridRes; j++){
					var x= (i+.5)/(chartWidth/gridRes)*(xRng[1]-xRng[0])+xRng[0]
					var y= (j+.5)/(chartHeight/gridRes)*(yRng[1]-yRng[0])+yRng[0]
					var vHat = numeric.dot(b, [1,x,y])
					vHat = Math.max(Math.min(vRng[1],vHat),vRng[0])
					var color=colorRamp(cRamp, (vHat-vRng[0])/(vRng[1]-vRng[0]))
					ctx.beginPath()
					ctx.fillStyle = color
					ctx.fillRect(lMargin+i*gridRes, tMargin+chartHeight-j*gridRes,gridRes+1,-gridRes-1)
					ctx.fill()
				}
			}
	
			predictedValue = numeric.dot(b,[1,predictPoint[0],predictPoint[1]])
			
		} else if (interp==5){
		//	console.log("quadratic trend")
			var X=[]
			var ones=filledArray(data[0].length, 1)
			X.push(ones)
			X.push(data[0].slice())
			X.push(data[1].slice())
			var xx=[], yy=[], xy=[]
			for(var i=0; i<data[0].length; i++){
				xx.push(data[0][i]*data[0][i])
				yy.push(data[1][i]*data[1][i])
				xy.push(data[0][i]*data[1][i])
			}
			X.push(xx)
			X.push(yy)
			X.push(xy)
			X = numeric.transpose(X)
		//	console.log(X)
			var Y=data[2].slice()
			var XXTinv = pinv(numeric.dot(numeric.transpose(X),X))
		//	console.log(XXTinv)
			var b = numeric.dot(XXTinv,numeric.dot(numeric.transpose(X),Y) )			
		//	console.log(b)
			for(var i=0; i<chartWidth/gridRes; i++){
				for(var j=0; j<chartHeight/gridRes; j++){
					var x= (i+.5)/(chartWidth/gridRes)*(xRng[1]-xRng[0])+xRng[0]
					var y= (j+.5)/(chartHeight/gridRes)*(yRng[1]-yRng[0])+yRng[0]
					var vHat = numeric.dot(b, [1,x,y,x*x,y*y,x*y])
					vHat = Math.max(Math.min(vRng[1],vHat),vRng[0])
					var color=colorRamp(cRamp, (vHat-vRng[0])/(vRng[1]-vRng[0]))
					ctx.beginPath()
					ctx.fillStyle = color
					ctx.fillRect(lMargin+i*gridRes, tMargin+chartHeight-j*gridRes,gridRes+1,-gridRes-1)
					ctx.fill()
				}
			}
	
			predictedValue = numeric.dot(b,[1,predictPoint[0],predictPoint[1],predictPoint[0]*predictPoint[0],predictPoint[1]*predictPoint[1],predictPoint[0]*predictPoint[1]])
			
		}
	}
	
	if(raster){	
		var pattern = document.createElement('canvas');
		pattern.width = 40;
		pattern.height = 40;
		var pctx = pattern.getContext('2d');
		pctx.fillStyle = "rgb(230, 230, 230)";
		pctx.fillRect(0,0,40,40);
		pctx.fillStyle = "rgb(200, 200, 200)";
		pctx.fillRect(0,0,20,20);
		pctx.fillRect(20,20,20,20);	
		var pattern = ctx.createPattern(pattern, "repeat");
				
		for(var i=0; i<data.length; i++){
			for(var j=0; j<data[0].length; j++){
				ctx.beginPath()
				var color=colorRamp(cRamp, (data[i][j]-vRng[0])/(vRng[1]-vRng[0]))
				if(data[i][j]=='NA') color=pattern
				ctx.fillStyle = color
				ctx.fillRect(tx(j-.5),ty(i-.5), tx(1)-tx(0)+1, ty(1)-ty(0)+1)
	//			ctx.arc(tx(data[0][i]),ty(data[1][i]),5*dotScale,0,pi2)
	//			ctx.stroke()
				ctx.fill()
/*				if(data[i][j]=='NA'){
					ctx.beginPath()
					ctx.strokeStyle="white"
					ctx.moveTo(tx(j-.5),ty(i-.5))
					ctx.lineTo(tx(j+.5),ty(i+.5))
					ctx.moveTo(tx(j+.5),ty(i-.5))
					ctx.lineTo(tx(j-.5),ty(i+.5))
					ctx.stroke()
				}*/
			}
		}
	}


	//Voronoi Plot
	if(document.getElementById('voronoiCheckbox').checked){
		var voronoi = new Voronoi();
//		var bbox = [xRng[0], xRng[1], yRng[0], yRng[1]]
		var bbox = {xl:lMargin, xr:lMargin+chartWidth, yt:tMargin, yb:chartHeight+tMargin}
	//	console.log(bbox)
		var sites=[]
		for(var i=0; i<data[0].length; i++){
			var newObj = {x:tx( data[0][i]), y:ty(data[1][i])}
			sites.push(newObj)
		}
		var diagram = voronoi.compute(sites, bbox)
//		console.log(sites)
		for(var i=0; i<diagram.cells.length; i++){
			var datai=0
			for(var j=0; j<diagram.cells.length; j++){
				if(sites[j].voronoiId == diagram.cells[i].site.voronoiId){
					datai=j
					break
				}
			}
			var color="red"
			if(document.getElementById('varType').value==1){
				for(var k=0; k<allVals.length; k++){
					if(data[2][datai]==allVals[k]){
						color=colorHexes[k%colors.length]
						break;
					}
				}
			} else {
			color=colorRamp(cRamp, ((data[2][datai]-vRng[0])/(vRng[1]-vRng[0])))
				
				
			}
			ctx.fillStyle=color
		
			var edges=diagram.cells[i].halfedges
			ctx.beginPath()
//			ctx.moveTo(tx(edges[0].getStartpoint().x), ty(edges[0].getStartpoint().y))
			ctx.moveTo(edges[0].getStartpoint().x, edges[0].getStartpoint().y)
			for(var k=0; k<edges.length; k++){
				ctx.lineTo(edges[k].getEndpoint().x, edges[k].getEndpoint().y)
//				ctx.lineTo(tx(edges[k].getEndpoint().x), ty(edges[k].getEndpoint().y))
			}
			ctx.closePath()
			ctx.stroke()
			ctx.fill()
		}
	}

	//Density Plot
	if(document.getElementById('densityCheckbox').checked){
		var nContours=5
		var gridSize=10
		var gridDeltaX = xRng/(chartWidth / gridSize)
		var gridDeltaY = yRng/(chartHeight / gridSize)
		var x = [], y=[]
		var color = colorHexDark
		if(document.getElementById('densitySelect').value==-1 || data.length<3){
			x=data[0].slice()
			y=data[1].slice()
		} else {
			for(var k=0; k<allVals.length; k++){
				if(document.getElementById('densitySelect').value==allVals[k]){
//						color=colorRamp(cRamp,k/(allVals.length-1))
					color=colorHexes[k%colors.length]
					break;
				}
			}
			for(var i=0; i<data[2].length; i++){
				if(data[2][i]==document.getElementById('densitySelect').value){
					x.push(data[0][i])
					y.push(data[1][i])


				}
			}
		}	
		//console.log(color)		
		renderDensity2D(x,y,ctx, "gaussian", false, nContours, [[lMargin,lMargin+chartWidth],[tMargin,tMargin+chartHeight]], [xRng,yRng], gridSize, color)		
		
	}
		
	//ShapeFile if applicable
	if(drawShapeFile){
		//console.log("drawing "+shapes.length+" shapes")
		//console.log(xBounds + " " +yBounds)
		for(var i=0;i<shapes.length; i++){
			//console.log(shapeBounds[i])
			//console.log("shape "+i+" inbounds?"+inBounds(shapeBounds[i]))
			if(inBounds(shapeBounds[i])){
				var fill=false
				var fillColor='white'
				if(shapeDataMap[i]!=-1){
					var v=data[2][shapeDataMap[i]]
					fill=true
					fillColor= colorRamp(cRamp, (v-vRng[0])/(vRng[1]-vRng[0]))

					if(varCat){
						for(var k=0; k<allVals.length; k++){
							if(data[2][shapeDataMap[i]]==allVals[k]){
								fillColor=colors[k%colors.length]
								break;
							}
						}
					}


				}
				drawShape(shapes[i], ctx, fill,fillColor)
			}
		}

/*		for(var i=0; i<shapeAdjacency.length; i++){
			for(var j=0; j<i; j++){
				if(shapeAdjacency[i][j]==true){
				ctx.beginPath()
				ctx.moveTo(tx(shapeCenters[i][0]), ty(shapeCenters[i][1]))
				ctx.lineTo(tx(shapeCenters[j][0]), ty(shapeCenters[j][1]))
				ctx.stroke()
				}
			}
		}*/
	/*	for(var i=0; i<shapeCenters.length; i++){
			drawX(shapeCenters[i], ctx)
			ctx.beginPath()
			ctx.fillStyle="red"
			ctx.fillText(fixed(shapeCenters[i][0])+" " +fixed(shapeCenters[i][1]), tx(shapeCenters[i][0]),ty(shapeCenters[i][1]))
			ctx.fill()
		}*/
		
	}

	//Neighborhood graph
//	var nGraphType=document.getElementById('neighborGraph').value
	if(document.getElementById('showNeighborhood').checked){
		ctx.beginPath()
		ctx.strokeStyle="black"
//		console.log(nW)
		for(var i=0; i<nW.length-1; i++){
			for(var j=1; j<nW[0].length; j++){
				if(nW[i][j]>0){
					if(!raster){
						ctx.moveTo(tx(data[0][i]),ty(data[1][i]))
						ctx.lineTo(tx(data[0][j]),ty(data[1][j]))
					}else{
						var y1=Math.floor(i/n+.01), y2=Math.floor(j/n+.01), x1=i%n, x2=j%n
						if(data[y1][x1]!="NA" && data[y2][x2]!="NA"){
							ctx.moveTo(tx(x1),ty(y1))
							ctx.lineTo(tx(x2),ty(y2))
						}
					}
				}
			}
		}
		ctx.stroke()
	}

	var dotScale=1
	var dotDensity = data.length / (chartWidth*chartHeight) * 100 //dots per 10x10 square
//	console.log("density = "+dotDensity);
	if(dotDensity>.001) dotScale=.75
	if(dotDensity>.002) dotScale=.65
	if(dotDensity>.003) dotScale=.55
//	console.log(varCat)
	dotScale*=scale
	if(!raster){
		if(debug)console.log("Drawing Points")
		for(var i=0; i<data[0].length; i++){
			var color=(pointsOnly?'black':colorRamp(cRamp, varCat?(data[2][i] == data[2][0]?1:0):((data[2][i]-vRng[0])/(vRng[1]-vRng[0]))))
			if(varCat){
				for(var k=0; k<allVals.length; k++){
					if(data[2][i]==allVals[k]){
//						color=colorRamp(cRamp,k/(allVals.length-1))
						color=colors[k%colors.length]
						break;
					}
				}
			}
			
//			console.log(vRng[0]+" " +vRng[1])
//			console.log(i+" " + data[2][i] + " " + color)
			ctx.beginPath()
			ctx.fillStyle = color
			ctx.arc(tx(data[0][i]),ty(data[1][i]),5*dotScale,0,pi2)
			ctx.stroke()
			ctx.fill()
		}
	} 
	if(raster && document.getElementById('showNeighborhood').checked){
		if(debug)console.log("Drawing Neighborhood Links")
		
		ctx.fillStyle = "black"
		for(var i=0; i<data.length; i++){
			for(var j=0; j<data[0].length; j++){
				if(data[i][j]!="NA"){
					ctx.beginPath()
					ctx.arc(tx(j),ty(i),5*dotScale,0,pi2)
					ctx.fill()
				}
			}
		}
	}

	if(boundaryCoords.length>0){
		if(debug)console.log("Drawing Boundary")
		ctx.fillStyle=("#EEE")
		ctx.beginPath()
		ctx.rect(lMargin,tMargin,chartWidth,chartHeight)
		ctx.moveTo(tx(boundaryCoords[0][0]), ty(boundaryCoords[0][1]))
		for(var i=0; i<boundaryCoords.length; i++){
			ctx.lineTo(tx(boundaryCoords[i][0]), ty(boundaryCoords[i][1]))
		}
		ctx.lineTo(tx(boundaryCoords[0][0]), ty(boundaryCoords[0][1]))
		ctx.stroke()
		ctx.fill()
	}
	
	if(predictPoint!=[]){
		var px=predictPoint[0], py=predictPoint[1]
		ctx.strokeStyle="red"
		drawX([px,py],ctx,10*scale, ["white","black"])
/*		ctx.beginPath()
		ctx.moveTo(tx(px)-5, ty(py)-5)
		ctx.lineTo(tx(px)+5, ty(py)+5)
		ctx.moveTo(tx(px)+5, ty(py)-5)
		ctx.lineTo(tx(px)-5, ty(py)+5)
		ctx.stroke()*/
	}
	
	ctx.restore()
	ctx.beginPath()
	ctx.strokeStyle="black"
	ctx.rect(lMargin,tMargin, chartWidth, chartHeight)
	ctx.stroke()
	
	if(debug)console.log("Drawing Axes")

	if(raster){
		chartAxisTicksX(ctx, tMargin+chartHeight, tx(xRng[0]+.5), tx(xRng[1]-.5), xRng[1]-xRng[0], xRng[0]+.5, xRng[1]-.5, fontSizeAxis*scale)
		chartAxisY(ctx,lMargin,ty(yRng[0]-.5),ty(yRng[1]+.5),yRng[0]-.5,yRng[1]+.5,yRng[0]-yRng[1]-1,axisLabel="",false,500,true,fontSizeAxis*scale)
	} else {
		chartAxisTicksX(ctx, tMargin+chartHeight, lMargin, lMargin+chartWidth, 7, xRng[0], xRng[1], fontSizeAxis*scale)
		chartAxisY(ctx,lMargin,tMargin+chartHeight,tMargin,yRng[0],yRng[1],7,axisLabel="",false,500,true,fontSizeAxis*scale)
	}
	
	
	//Draw Legend
	if(legend){
		var grd = ctx.createLinearGradient(lMargin, tMargin+20*scale, lMargin+chartWidth, tMargin+30*scale)
		for(var i=0; i<ramps[cRamp].length; i++){
			var gcolor="rgb("+ramps[cRamp][i][0]+","+ramps[cRamp][i][1]+","+ramps[cRamp][i][2]+")"
			grd.addColorStop(i/(ramps[cRamp].length-1), gcolor)
		}
		var legendMargin = 30
//		console.log(cRamp)
		ctx.fillStyle=grd
		ctx.beginPath()
		ctx.fillRect(lMargin, tMargin+chartHeight+legendMargin*scale, chartWidth, 10*scale)
		ctx.strokeStyle='black'
		ctx.rect(lMargin, tMargin+chartHeight+legendMargin*scale, chartWidth, 10*scale)
		ctx.fill()
		ctx.stroke()
		
		var nTicks = Math.min(uniqueValues(data[3]).length,9)
		
		chartAxisTicksX(ctx, tMargin+chartHeight+(legendMargin+10)*scale, lMargin, lMargin+chartWidth,nTicks,vRng[0],vRng[1],fontSizeAxis*scale)
		
		
	}
}

function ripleyCorrection(t,D,method=1){
	//sort D from lowest to highest	
	D=sortArray(D)
	if(method==1){
		
		if(t<= D[0]){
			return 1
		} else if (t <=D[1]){
			return pi2/(pi2-(2*Math.acos(D[0]/t)-Math.sin(2*Math.acos(D[0]/t))))
			//2*Math.acos(D[0]/t)
		} else if (t <= D[2]){
			if(t*t > D[0]*D[0]+D[1]*D[1]){
				return (Math.PI*t*t)/((pi2-Math.PI/2 - Math.acos(D[0]/t) - Math.acos(D[1]/t))*t*t/2 + D[0]*D[1] + .5*D[0]*Math.sqrt(t*t-D[0]*D[0])+.5*D[1]*Math.sqrt(t*t-D[1]*D[1]))
			} else {
				return pi2/(pi2-(2*(Math.acos(D[0]/t)+Math.acos(D[1]/t))-Math.sin(2*Math.acos(D[0]/t))-Math.sin(2*Math.acos(D[1]/t))))
			}
		} else {
			return 0
		}
	} else if (method==2){
		if(t<= D[0]){
			return 1
		} else if (t <=D[1]){
			var d=D[0]
			var e=Math.sqrt(t*t-d*d)
			var alpha=Math.acos(d/t)
			return Math.PI*t*t/(e*d+(Math.PI-alpha)*t*t)
		} else if (t <= D[2]){
			var d1=D[0], d2=D[1], e1=Math.sqrt(t*t-d1*d1), e2=Math.sqrt(t*t-d2*d2)
			var alpha1=Math.acos(d1/t), alpha2=Math.acos(d2/t)
			if(t*t > d1*d1+d2*d2){
				return Math.PI*t*t/(d1*d2+.5*(e1*d1+e2*d2)+(.75*Math.PI-.5*alpha1-.5*alpha2)*t*t)
			} else {
				return Math.PI*t*t/(e1*d1+e2*d2 +(Math.PI-alpha1-alpha2)*t*t)
			}
		} else {
			return 0
		}		
	}
}

function ripleyCorrectionPoly(t,px,py){
	var c=0
	for(var i=0; i<circleGrid.length; i++){
		if(inside(px+circleGrid[i][0]*t, py+circleGrid[i][1]*t, boundaryCoords) )c++
	}
	return c/circleGrid.length
}

function getK(pointData, xRng, yRng, distances, maxR, dm, onlyView="-1"){
//	if(debug)console.log("calculating ripley's K")
	var K=[0]
	var n=pointData[0].length
	if(onlyView !="-1" && pointData.length>2){
		n=0
		for(var i=0; i<pointData[2].length; i++) if(pointData[2][i]==onlyView)n++
	}
//	var Wstd=(xRng[1]-xRng[0])*(yRng[1]-yRng[0])/(n*(n-1))
	var Wstd=(xRng[1]-xRng[0])*(yRng[1]-yRng[0])/(n*n)
	for(var k=0; k<distances.length && distances[k]<=maxR; k++){
		var t=distances[k]
		if(t>0){
			K[k]=0
			for(var i=0; i<pointData[0].length; i++){
				if(onlyView=="-1" || pointData.length<3 || pointData[2][i]==onlyView){
					var xi=pointData[0][i], yi=pointData[1][i]
					var D=[xi-xRng[0], yi-yRng[0], xRng[1]-xi, yRng[1]-yi]
					var c=(boundaryCoords.length>0?ripleyCorrectionPoly(t,xi,yi):ripleyCorrection(t,D,2))
					for(var j=0; j<pointData[0].length; j++){
						if(i!=j && dm[i][j]<=t && (onlyView=="-1" || pointData.length<3 || pointData[2][j]==onlyView)) K[k] += c
					}
				}
			}
			K[k]*=Wstd
		}
	}
//	if(debug)console.log("done calculating ripley's K")
	return K
}

function standardizeK(K, standardization, distances){
	for(var i=0; i<K.length; i++){
		if(standardization=='L(r)'){
			K[i] = Math.sqrt(K[i]/Math.PI)
		} else if(standardization=='L(r)-r'){
			K[i]=Math.sqrt(K[i]/Math.PI)-distances[i]
		} else if(standardization=='K(r)/pir2'){
			if(distances[i]>0) K[i] *= 1/(Math.PI * distances[i]*distances[i])
		} else if(standardization=='K(r)-pir2'){
			K[i] -= Math.PI * distances[i]*distances[i]
		}
	}
	return K
}

function ripleysK(data, canvasElmt="ripleysKplot", quickEnvelope=true){
	var c=document.getElementById(canvasElmt)
	var drawEnvelope=document.getElementById('drawEnvelope').checked
	var ctx=c.getContext("2d")
	var scale=c.width/490
	var tMargin=30*scale, rMargin=10*scale, lMargin=50*scale, bMargin=50*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	var polyBorder = boundaryCoords.length>0
	//consider r up to 1/2 the minimum dimension in the study area
	//Edge correction weight: divide by the proportion of the circumfrence in the study area
	//t is the radius of the circle
	//D=[d1, d2, d3, d4] are the distances to the 4 sides of the area
	//cij=2pi/(2pi-alphaOut) correction factor
	var xRng=[+jStat.min(data[0]),+jStat.max(data[0])]
	var yRng=[+jStat.min(data[1]),+jStat.max(data[1])]
//	var plotMargin=.20
//	xRng=[+xRng[0]-plotMargin*(xRng[1]-xRng[0]),+xRng[1]+plotMargin*(xRng[1]-xRng[0])]
//	yRng=[+yRng[0]-plotMargin*(yRng[1]-yRng[0]),yRng[1]+plotMargin*(yRng[1]-yRng[0])]
	var n=data[0].length
	var onlyView=(exists('catRipleySelect')?document.getElementById('catRipleySelect').value:"-1")
	if(onlyView!= "-1" && data.length>2){
		n=0
		for(var i=0; i<data[2].length; i++) if(data[2][i]==onlyView) n++
	}
	

	var distances=[]
	for(var i=0; i<distMatrix.length; i++){
		for(var j=0; j<distMatrix[i].length; j++){
			distances.push(distMatrix[i][j])
		}
	}
	distances = sortArray(uniqueValues(distances))

	var standardization = document.getElementById('ripleyStd').value
	var maxR=Math.min(xRng[1]-xRng[0], yRng[1]-yRng[0])*.45
	
	distances=[0]
	for(var j=1; j<50; j++){ distances[j]=maxR*j/(49) }
	//console.log(distances)
	
	var K=getK(data, xRng, yRng, distances, maxR,distMatrix, onlyView)
	var maxk=K.length-1
	//console.log(maxk)
	

//	console.log(Wstd)
	//console.log("max R="+maxR)
//	console.log("max distance="+distances[maxk]+" not "+distances[maxk+1])
//	console.log(standardization)
	var yLabel="K(r)"
	
	K=standardizeK(K, standardization, distances)
	
	if(standardization=='L(r)'){yLabel="L(r)"
	} else if(standardization=='L(r)-r'){yLabel="L(r)-r"
	} else if(standardization=='K(r)/pir2'){yLabel="K(r)/(\u03c0r²)"
	} else if(standardization=='K(r)-pir2'){yLabel="K(r)-\u03c0r²"
	}

	
	var distRes=25
	var envBounds=[Infinity,-Infinity]
	var mcDist=[]
	var envAdj=[]
		var envelope=[]

//	console.log(n)
	
	var nMonteCarloSim = quickEnvelope?39:200

	if(drawEnvelope || polyBorder){
		for(var j=0; j<distRes; j++){
			mcDist[j]=maxR*Math.max(j,.5)/(distRes-1)
		}
		for(var i=0; i<mcDist.length; i++) envelope[i]=[Infinity,-Infinity]
		var mcK=[]
		for(var j=0; j<nMonteCarloSim; j++){
			mcData=[[],[]]
			for(var i=0; i<n; i++) {
				var inBounds=false
				while(!inBounds){
					mcData[0][i]=xRng[0]+Math.random()*(xRng[1]-xRng[0])
					mcData[1][i]=yRng[0]+Math.random()*(yRng[1]-yRng[0])	
					inBounds = polyBorder?inside(mcData[0][i],mcData[1][i],boundaryCoords):true
				}
			}
			var DM = createDistanceMatrix(mcData)
			//if(j==0) console.log(DM)
			mcK[j] = getK(mcData, xRng, yRng, mcDist, maxR, DM)
			mcK[j]=standardizeK(mcK[j], standardization, mcDist)
			if(quickEnvelope){
				for(var i=0; i<envelope.length; i++){
					envelope[i][0]=Math.min(envelope[i][0],mcK[j][i])
					envelope[i][1]=Math.max(envelope[i][1],mcK[j][i])
				}
			}
		}
		if(!quickEnvelope){
			for(var i=0; i<envelope.length; i++){
				var percK=[]
				for(var j=0; j<mcK.length; j++) percK.push(mcK[j][i])
				envelope[i][0]=Math.min(envelope[i][0],jStat.percentile(percK, .025))
				envelope[i][1]=Math.max(envelope[i][1],jStat.percentile(percK, .975))
			}
		}
		
		for(var i=0; i<envelope.length; i++){
			if(polyBorder){
				var envMean = (envelope[i][0]+envelope[i][1])/2
				var expected = 0
				if(standardization=='none') expected = mcDist[i]*mcDist[i]*Math.PI
				if(standardization=='L(r)') expected = mcDist[i]
				if(standardization=='K(r)/pir2') expected = 1
				envAdj.push(expected-envMean)
				envelope[i][1] += (expected-envMean)
				envelope[i][0] += (expected-envMean)
			}
			envBounds[0]=Math.min(envelope[i][0],envBounds[0])
			envBounds[1]=Math.max(envelope[i][1],envBounds[1])
		}
		
	}
	
	if(polyBorder){
		for(var i=0; i<K.length; i++){
			var vAdj = 0
			for(var j=0; mcDist[j]<=distances[i]; j++) vAdj=envAdj[j]
			K[i]+=vAdj
		}
	}
	setChartParams(0,distances[maxk],jStat.min(K),jStat.max(K),chartWidth,chartHeight,lMargin,tMargin)
	ctx.beginPath()
	ctx.fillStyle="white"
	ctx.fillRect(0,0,c.width, c.height)
	ctx.fill()
	
	ctx.save();
	ctx.beginPath();
	ctx.rect(lMargin,tMargin,chartWidth,chartHeight)
	ctx.clip();	
	
	ctx.lineWidth=Math.max(1,.75*scale)
	
	if(drawEnvelope){
		setChartParams(0,distances[maxk],Math.min(envBounds[0],jStat.min(K)),Math.max(envBounds[1],jStat.max(K)),chartWidth,chartHeight,lMargin,tMargin)
	
		ctx.beginPath()
		ctx.fillStyle="#CCC"
	//	console.log(mcDist)
	//	console.log(envelope)
		ctx.moveTo(tx(mcDist[0]),ty(envelope[0][0]))
		for(var i=0; i<envelope.length; i++) ctx.lineTo(tx(mcDist[i]),ty(envelope[i][0]))
		for(var i=envelope.length-1; i>=0; i--) ctx.lineTo(tx(mcDist[i]),ty(envelope[i][1]))
		ctx.fill()
	}	
	
	ctx.beginPath()
	ctx.strokeStyle="red"
	ctx.setLineDash([5,5])
	ctx.moveTo(tx(0),ty(standardization!='K(r)/pir2'?0:1))
	if(standardization=='none'){
		for(var i=1; i<=20; i++){
			var r=i/20*maxR
			ctx.lineTo(tx(r),ty(Math.PI*r*r))		
		}
	} else {
		ctx.lineTo(tx(distances[K.length-1]),ty(standardization=="L(r)"?distances[K.length-1]:(standardization=="L(r)-r"||standardization=='K(r)-pir2'?0:1)))
	}
	ctx.stroke()

	ctx.strokeStyle="black"
	ctx.setLineDash([])
	ctx.beginPath()
	ctx.moveTo(tx(0),ty(0))
	for(var i=1; i<K.length; i++){
		ctx.lineTo(tx(distances[i]),ty(K[i]))
	}
	ctx.stroke()
	ctx.restore()

	chartAxisX(ctx, tMargin+chartHeight, tx(0), tx(maxR), 0, maxR, 10,"r",false,[],fontSizeAxis*scale)
	var yAxisBounds=[Math.min(envBounds[0],jStat.min(K)), Math.max(envBounds[1],jStat.max(K))]
	chartAxisY(ctx,lMargin,ty(yAxisBounds[0]),ty(yAxisBounds[1]),yAxisBounds[0],yAxisBounds[1],10,yLabel,false,false,false,fontSizeAxis*scale)
}

function loss(X) {
	var n = X[0]
	var sill = X[1]
	var range = X[3]	
	var model = (exists('semivariogramModel')?document.getElementById('semivariogramModel').value:"spherical")
	var sumsq = 0
	for(var i=0; i<lag.length; i++){
		sumsq += semiN[i]*Math.pow(semi[i] - semivar(lag[i],X, model),2)
	}
	return sumsq
}

function semivar(h, X, model){
	if(X[0]<0) return Infinity
	if(X[1]>jStat.max(semi)) return Infinity
	if(X[2]>lag[lag.length-1]) return Infinity
	if(model=="exponential"){
		return (X[0] + X[1]*(1-Math.exp(-h/(X[2]/3))))
	} else if(model=="spherical"){
		return (h>X[2]?X[0]+X[1]:X[0] + X[1]*(1.5*h/X[2] - .5*Math.pow(h/X[2],3)  ))		
	} else if(model=="gaussian"){
		return (X[0] + X[1]*(1-Math.exp(-h*h/(X[2]*X[2]/3))))
	}	
}

function matrixToColumn(dataMatrix){
	var n=dataMatrix.length, m=dataMatrix[0].length
	var columnData = [[],[],[]]
	for(var i=0; i<n; i++){
		for(var j=0; j<m; j++){
			columnData[0].push(i)
			columnData[1].push(j)
			columnData[2].push(+dataMatrix[i][j])
		}
	}
	return columnData
}

function semiVariogram(data, canvasElmt='semiVariogram', raster=false){
	console.log('making semivariogram')
//	raster=dataEntryChoice==2
	if(raster) data=matrixToColumn(data)
	if(document.getElementById('varType').value==1) return false;
	if(debug) console.log("semiVariogram()")
	var c=document.getElementById(canvasElmt)
	var ctx=c.getContext("2d")
	var scale=c.width/490
	var tMargin=30*scale, rMargin=10*scale, lMargin=50*scale, bMargin=50*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	var i, j, k, l, n = data[2].length;

	var model = (exists('semivariogramModel')?document.getElementById('semivariogramModel').value:"spherical")
//	console.log("kriging model: "+model)
	console.log(data)

	var dist = Array((n*n-n)/2);
	for(i=0,k=0;i<n;i++)
		for(j=0;j<i;j++,k++) {
		dist[k] = Array(2);
		dist[k][0] = distance(data[0][i],data[1][i],data[0][j],data[1][j])/*Math.pow(
			Math.pow(data[0][i]-data[0][j], 2)+
			Math.pow(data[1][i]-data[1][j], 2), 0.5)*/;
		dist[k][1] = Math.pow(data[2][i]-data[2][j],2);
		}
	dist.sort(function(a, b) { return a[0] - b[0]; });
	var range = dist[(n*n-n)/2-1][0]/1;
	// Bin lag distance
	var lags = ((n*n-n)/2)>15?15:(n*n-n);
	var tolerance = range/lags;
	lag = [];
	semi = [];
	
	console.log(tolerance)
	
	for(i=0; i<lags; i++){
		lag[i]=0;
		semi[i]=0;
		semiN[i]=0
	}
	for(i=0,j=0,k=0,l=0;i<lags&&j<((n*n-n)/2);i++,k=0) {
		while(dist[j][0]>(i*tolerance) && dist[j][0]<=((i+1)*tolerance) ) {
			lag[l] += dist[j][0];
			semi[l] += dist[j][1];
			semiN[l]++
			j++;k++;
			if(j>=((n*n-n)/2)) break;
		}
		if(k>0) {
			lag[l] /= k;
			semi[l] /= (2*k);//  I added the 2 to make this the semivariogram...
			l++;
		}
	}
	console.log(lag)
	console.log(semi)
	if(l<2) return false; // Error: Not enough points

	var maxLag=jStat.max(lag)
	var maxSemi=jStat.max(semi)
	
	setChartParams(0,maxLag,0,maxSemi,chartWidth,chartHeight,lMargin,tMargin)
	ctx.beginPath()
	ctx.fillStyle="white"
	ctx.fillRect(0,0,c.width, c.height)
	ctx.fill()

	var semivarOutput = ""
	if(model!="none"){
		var solution = fmin.nelderMead(loss, [0,maxSemi*.8,maxLag*.5])
		solution.x[1]=Math.min(maxSemi-solution.x[0],solution.x[1])
		solution.x[2]=Math.min(maxLag,solution.x[2])
		semivarOutput +="Nugget: "+fixed(solution.x[0]) + "<br>"
		semivarOutput +="Partial Sill: "+fixed(solution.x[1]) + "<br>"
		semivarOutput +="Range: "+fixed(solution.x[2]) + "<br>"
		semivarOutput +="Sum Squared Error: "+fixed(loss(solution.x)) + "<br>"
		var variogramRes = 30
		ctx.beginPath()
		ctx.strokeStyle="red"
		for(var h=0; h<maxLag+(maxLag/variogramRes)/2; h+= maxLag/variogramRes){
			var curveY= semivar(h, solution.x, model)
			if(h==0){
				ctx.moveTo(tx(h), ty(curveY))
			} else {
				ctx.lineTo(tx(h), ty(curveY))
			}
		}	
		ctx.stroke()
		
		ctx.beginPath()
		ctx.setLineDash([5,5]);
		ctx.moveTo(tx(solution.x[2]),ty(0))
		ctx.lineTo(tx(solution.x[2]),ty(solution.x[0]+solution.x[1]))
		ctx.moveTo(tx(0),ty(solution.x[0]+solution.x[1]))
		ctx.lineTo(tx(maxLag),ty(solution.x[0]+solution.x[1]))
		ctx.moveTo(tx(0),ty(solution.x[0]))
		ctx.lineTo(tx(maxLag),ty(solution.x[0]))
		ctx.stroke()
		ctx.setLineDash([5,0]);
	}
	document.getElementById('semivarStats').innerHTML=semivarOutput


	//Draw Dots
	ctx.fillStyle = 'black'
	for(i=0; i<l; i++){
		ctx.beginPath()
		ctx.arc(tx(lag[i]),ty(semi[i]),3*scale,0,pi2)
		ctx.fill()
	}
	

	chartAxisX(ctx,tMargin+chartHeight,lMargin,lMargin+chartWidth,0,maxLag,10,axisLabel="lag distance",false,[],fontSizeAxis*scale)
	chartAxisY(ctx,lMargin,tMargin+chartHeight,tMargin,0,maxSemi,10,axisLabel="\u03B3(h)",false,false,false,fontSizeAxis*scale)
}

function moranPlot(z, W, canvasElmt='moranPlot', envelope=true){	
	var n=z.length
	for(var i=0; i<n; i++) z[i]=+z[i]
	var y=[]
//	console.log(z)
	for(var i=0; i<n; i++){
		var yVal=0
		var wSum=0
		for(var j=0; j<n; j++){
			yVal +=W[i][j]*z[j]
			wSum +=W[i][j]
		}
		if(wSum>0) yVal /= wSum
		y.push(yVal)
	}

	var c=document.getElementById(canvasElmt)
	var ctx=c.getContext("2d")
	var scale=c.width/490
	var tMargin=30*scale, rMargin=10*scale, lMargin=50*scale, bMargin=50*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	var xMin=jStat.min(z), xMax=jStat.max(z), yMin=jStat.min(y), yMax=jStat.max(y)
	setChartParams(xMin,xMax,yMin,yMax,chartWidth,chartHeight,lMargin,tMargin)

	ctx.beginPath()
	ctx.fillStyle="white"
	ctx.fillRect(0,0,c.width, c.height)
	ctx.fill()

	ctx.save()
	ctx.rect(lMargin,tMargin,chartWidth,chartHeight)
	ctx.clip();


	if(envelope){
		ctx.strokeStyle='rgba(200,200,200,.3)'
		ctx.lineWidth=3
		moranImonteCarlo=[]
		for(var k=0; k<499; k++){
			var zk=z.slice()
			zk=shuffle(zk)
			var yk=[]
			for(var i=0; i<n; i++){
				var yVal=0
				var wSum=0
				for(var j=0; j<n; j++){
					yVal +=W[i][j]*zk[j]
				}
				if(wSum>0) yVal /= wSum
				yk.push(yVal)
			}			
			var slope = jStat.corrcoeff(zk,yk)*jStat.stdev(yk,true)/jStat.stdev(zk,true)
			var intercept = jStat.mean(yk)-jStat.mean(zk)*slope
			moranImonteCarlo.push(jStat.corrcoeff(zk,yk))
			ctx.beginPath()
			ctx.moveTo(tx(xMin),ty(intercept+xMin*slope))
			ctx.lineTo(tx(xMax),ty(intercept+xMax*slope))
			ctx.stroke()
		}
		ctx.lineWidth=1
	}



	ctx.strokeStyle = 'black'
	
	ctx.beginPath()
	ctx.moveTo(tx(0),ty(yMin))
	ctx.lineTo(tx(0),ty(yMax))
	ctx.moveTo(tx(xMin),ty(0))
	ctx.lineTo(tx(xMax),ty(0))
	ctx.stroke()


	
	for(i=0; i<n; i++){
		ctx.beginPath()
		ctx.arc(tx(z[i]),ty(y[i]),2*scale,0,pi2)
		ctx.stroke()
	}
	moransI = jStat.corrcoeff(z,y)

	var slope = jStat.corrcoeff(z,y)*jStat.stdev(y,true)/jStat.stdev(z,true)
	var intercept = jStat.mean(y)-jStat.mean(z)*slope
	ctx.beginPath()
	ctx.strokeStyle="red"
	ctx.moveTo(tx(xMin),ty(intercept+xMin*slope))
	ctx.lineTo(tx(xMax),ty(intercept+xMax*slope))
	ctx.stroke()
	ctx.restore()
	
	chartAxisX(ctx,tMargin+chartHeight,lMargin,lMargin+chartWidth,xMin, xMax,10,axisLabel="value",false,[],fsize=fontSizeAxis*scale)
	chartAxisY(ctx,lMargin,tMargin+chartHeight,tMargin,yMin,yMax,10,axisLabel="average neighbor value",false,false,true,fsize=fontSizeAxis*scale)	
	
}

//-----------------------------------------------------------------
//         MULTIVARIATE PLOTS
//-----------------------------------------------------------------
function hexplot(Xvar=1,Yvar=2, units1="", units2=""){
	var c=document.getElementById("hexplot")
	var marginals= (document.getElementById("hexMarginal").checked==true)
	var extraMargin = (marginals==true?75:0)
	var ctx=c.getContext("2d")
	ctx.save();
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);	
	var scale=c.width/480
	var lMargin=50*scale
	var rMargin=(10+extraMargin)*scale
	var tMargin=(20+extraMargin)*scale
	var bMargin=35*scale
	var buffer = .10
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin
	var hexResolution=Math.floor(document.getElementById("hexRes").value)
	var hexWidth = chartWidth/hexResolution
	var Xdata = getColumn(Xvar)
	var n = Xdata.length
	for(var i=0; i<n; i++) { Xdata[i] = +Xdata[i]; }
	var Ydata = getColumn(Yvar)
	for(var i=0; i<n; i++) { Ydata[i] = +Ydata[i]; }
	
	var Xmin = jStat.min(Xdata)
	var Xmax = jStat.max(Xdata)
	var Ymin = jStat.min(Ydata)
	var Ymax = jStat.max(Ydata)
	for(var i=0; i<n; i++){
		if(Xdata[i]>Xmax) Xmax = Xdata[i];
		if(Xdata[i]<Xmin) Xmin = Xdata[i];
		if(Ydata[i]>Ymax) Ymax = Ydata[i];
		if(Ydata[i]<Ymin) Ymin = Ydata[i];
	}
	Xmin += -(Xmax-Xmin)*buffer
	Xmax += (Xmax-Xmin)*buffer
	Ymin += -(Ymax-Ymin)*buffer
	Ymax += (Ymax-Ymin)*buffer
	var qYrange = Ymax - Ymin
	var qXrange = Xmax - Xmin
	
	ctx.beginPath();
	ctx.rect(lMargin,tMargin,chartWidth,chartHeight)
	ctx.clip();
	
	//Draw the hexagons
	var hexRadius = hexWidth * Math.sqrt(3)/3
	var hexCenterX = []
	var tempIndex=0
	for (var hexX = lMargin; hexX<=lMargin+chartWidth+hexWidth/2; hexX+=hexWidth/2){
		hexCenterX[tempIndex] = hexX
		tempIndex++
	}
	var hexCenterY = []
	tempIndex=0
	for (var hexY = tMargin; hexY <=tMargin+chartHeight; hexY = tMargin+hexWidth*Math.sqrt(3)*tempIndex){
		hexCenterY[tempIndex] = hexY
		tempIndex++
	}
	
	var hexCounts = new Array(hexCenterX.length)
	for(var i=0; i<hexCounts.length; i++){
		hexCounts[i]=new Array(hexCenterY.length)
		for(var j=0; j<hexCounts[0].length; j++){
			hexCounts[i][j]=0
		}
	}
	
	for (var i=0; i<n; i++){
		var qX = (-Xmin + Xdata[i])/qXrange
		var qY = (-Ymin + Ydata[i])/qYrange
		var realX = lMargin+5+(qX)*(chartWidth-10)
		var realY = tMargin+5+(1-qY)*(chartHeight-10)
		var x1 = Math.floor((realX-lMargin)*2/hexWidth)
		var y0 = Math.floor((realY-tMargin)/(hexWidth*Math.sqrt(3)/2))
		var y1 = Math.floor(y0/2)+((x1%2==0 && y0%2==1)?1:0)
		var y2 = Math.floor(y0/2)+((x1%2==1 && y0%2==1)?1:0)
		var cX1 = hexCenterX[x1]
		var cY1 = hexCenterY[y1]+(x1%2==1 ? hexRadius*1.5:0)
		var cX2 = hexCenterX[x1+1]
		var cY2 = hexCenterY[y2]+(x1%2==0 ? hexRadius*1.5:0)
		var d1 = Math.sqrt(Math.pow(realX-cX1,2)+Math.pow(realY-cY1,2))
		var d2 = Math.sqrt(Math.pow(realX-cX2,2)+Math.pow(realY-cY2,2))
		if( d1<d2) hexCounts[x1][y1]++
		else hexCounts[x1+1][y2]++
	}
	
	var maxCount = 0
	for(var i=0; i<hexCounts.length; i++){
		for(var j=0; j<hexCounts[0].length; j++){
			if(hexCounts[i][j]>maxCount){
				maxCount=hexCounts[i][j]
			}
		}
	}
	for(var i=0; i<hexCounts.length; i++){
		for(var j=0; j<hexCounts[0].length; j++){
			hexCounts[i][j] *= 1.0/maxCount
		}
	}
	var darkRGB = hexToRgb(colorHexDark)
	for(var i=0; i<hexCenterX.length; i++){
		var vOffset=0
		if (i % 2 ==1) {
			vOffset = hexRadius*1.5
		}
		
		for(var j=0; j<hexCenterY.length; j++){
		if(hexCounts[i][j]==0){
//						ctx.fillStyle='rgba(240,240,240,1)';
			ctx.fillStyle='white';
			ctx.strokeStyle=ctx.fillStyle;
		} else {
			var p=hexCounts[i][j];
			ctx.fillStyle = 'rgba('+(p*darkRGB.r+(1-p)*255)+','+(p*darkRGB.g+(1-p)*255)+','+(p*darkRGB.b+(1-p)*255)+',1)'
			ctx.strokeStyle = "white"
		}
			ctx.beginPath();
			for(var angle = Math.PI/6 ; angle<2*Math.PI; angle+=Math.PI/3){
				if(angle==30) ctx.moveTo(hexCenterX[i]+(hexRadius+.15)*Math.cos(angle),vOffset+hexCenterY[j]+(hexRadius+.15)*Math.sin(angle));
				else ctx.lineTo(hexCenterX[i]+(hexRadius+.15)*Math.cos(angle),vOffset+hexCenterY[j]+(hexRadius+.15)*Math.sin(angle));
			}
//						ctx.stroke();
			ctx.fill();
		}
	}
	
	ctx.restore();
	if(marginals){
		ctx.fillStyle = colorHexLite;
		var nBins = hexResolution
		var hBinCount = new Array(nBins)
		var vBinCount = new Array(nBins)
		for(var i=0; i<hBinCount.length; i++){
			hBinCount[i]=0;
			vBinCount[i]=0;
		}
		for(var i=0; i<n; i++){
			hBinCount[Math.floor(((Xdata[i]-Xmin)/qXrange)*nBins) ]++
			vBinCount[Math.floor(((Ydata[i]-Ymin)/qYrange)*nBins) ]++
		}
		var xCount=0, yCount=0;
		for(var i=0; i<nBins; i++){
			if(hBinCount[i]>xCount) xCount=hBinCount[i];
			if(vBinCount[i]>yCount) yCount=vBinCount[i];
		}
		//console.log("xCount="+xCount+", yCount="+yCount)

		for(var i=0; i<nBins; i++){
			ctx.fillRect(lMargin+chartWidth/nBins*i, tMargin-extraMargin*hBinCount[i]/xCount, chartWidth/nBins, extraMargin*hBinCount[i]/xCount);	
			ctx.fillRect(lMargin+chartWidth, tMargin+chartHeight/nBins*(nBins-i-1), extraMargin*vBinCount[i]/yCount, chartHeight/nBins);	
		}
		ctx.beginPath();
		ctx.moveTo(lMargin,tMargin);
		ctx.lineTo(lMargin+chartWidth,tMargin);
		ctx.lineTo(lMargin+chartWidth,tMargin+chartHeight);
		ctx.stroke();
	}
	ctx.fillStyle = "black";

	ctx.beginPath();
	ctx.moveTo(lMargin,tMargin);
	ctx.lineTo(lMargin,tMargin+chartHeight);
	ctx.lineTo(lMargin+chartWidth,tMargin+chartHeight);
	ctx.stroke();

	var units = [units1, units2]	
	chartTitle(ctx, "Hex Plot", lMargin+.5*chartWidth, 0, fontSizeTitle*scale)
	chartAxisY(ctx,lMargin,tMargin+chartHeight-5,tMargin+5,Ymin,Ymax,10,document.getElementById("name"+Yvar).value+(units[1]!=""?" ("+units[1]+")":""), false,chartWidth,true, fontSizeAxis*scale)	
	chartAxisX(ctx,tMargin + chartHeight,lMargin+5,lMargin+chartWidth-5,Xmin,Xmax,10,document.getElementById("name"+Xvar).value+(units[0]!=""?" ("+units[0]+")":""), false,[],fontSizeAxis*scale)
	
}

function scatterplot(Xdata,Ydata,logisticReg=false, xLabel="", yLabel="", drawLine=false, CIband=false, predBand=false, groups=false, drawLines=false, x=[], y=[],legend=[],xVals=[], canvas='scatterplot',  units=["",""]) {
//	console.log("scatterplot: "+xVals)
	var c=document.getElementById(canvas)
	var ctx=c.getContext("2d")
	//ctx.font = "12px sans-serif";
	ctx.save();
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);	
	var scale = c.width/480
	var lMargin=50*scale
	var rMargin=10*scale
	var tMargin=20*scale
	var bMargin=50*scale
	var cMargin=5*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin		
	
	var n = Xdata.length
	var Xmin = +jStat.min(Xdata)
	var Xmax = +jStat.max(Xdata)
	var Ymin = +jStat.min(Ydata)
	var Ymax = +jStat.max(Ydata)
	for(var i=0; i<n; i++){
		if(Xdata[i]>Xmax) Xmax = Xdata[i];
		if(Xdata[i]<Xmin) Xmin = Xdata[i];
		if(Ydata[i]>Ymax) Ymax = Ydata[i];
		if(Ydata[i]<Ymin) Ymin = Ydata[i];
	}
	var qYrange = Ymax - Ymin
	var qXrange = Xmax - Xmin
	
	ctx.beginPath();
	ctx.rect(lMargin,tMargin,chartWidth,chartHeight)
	ctx.clip();
	setChartParams(Xmin, Xmax, Ymin, Ymax,chartWidth-2*cMargin,chartHeight-2*cMargin, lMargin+cMargin, tMargin+cMargin)
	
	if(predBand || CIband){
		var stdError = parseFloat(document.getElementById("stdError").innerHTML)
		var b0=parseFloat(document.getElementById('b0').innerHTML)
		var b1=parseFloat(document.getElementById('b1').innerHTML)
		var cLevel = parseFloat(document.getElementById("cLevel").value)
		var xBar = jStat.mean(Xdata)
		var xVar = jStat.variance(Xdata,true)
		
		//Prediction Interval Band
		if(predBand){
			ctx.beginPath()
			ctx.fillStyle="lightblue"
			
			var tCrit = jStat.studentt.inv(.5+cLevel/2,n-2)
			for(var i=-2; i<=102; i++){
				var X = i/100*(qXrange)+Xmin
	//					var Y = b0+b1*X-10
				var Y = b0+b1*X-tCrit*stdError*Math.sqrt(1+1/n+Math.pow(X-xBar,2)/((n-1)*xVar))
				var cX = lMargin+5+((X-Xmin)/qXrange)*(chartWidth-10)
				var cY = tMargin+5+(1-(Y-Ymin)/qYrange)*(chartHeight-10)
				if(i==-2){
					ctx.moveTo(cX,cY)
				}else {
					ctx.lineTo(cX,cY)
				}
			}
			for(var i=102; i>=-2; i--){
				var X = i/100*(qXrange)+Xmin
	//					var Y = b0+b1*X+10
				var Y = b0+b1*X+tCrit*stdError*Math.sqrt(1+1/n+Math.pow(X-xBar,2)/((n-1)*xVar))
				var cX = lMargin+5+((X-Xmin)/qXrange)*(chartWidth-10)
				var cY = tMargin+5+(1-(Y-Ymin)/qYrange)*(chartHeight-10)
				ctx.lineTo(cX,cY)
			}
			//ctx.stroke()
			ctx.fill()
		}

		
		if(CIband){
			ctx.beginPath()
			ctx.setLineDash([5, 3]);/*dashes are 5px and spaces are 3px*/
			var tCrit = jStat.studentt.inv(.5+cLevel/2,n-2)
			for(var i=-2; i<=102; i++){
				var X = i/100*(qXrange)+Xmin
//					var Y = b0+b1*X-10
				var Y = b0+b1*X-tCrit*stdError*Math.sqrt(1/n+Math.pow(X-xBar,2)/((n-1)*xVar))
				var cX = lMargin+5+((X-Xmin)/qXrange)*(chartWidth-10)
				var cY = tMargin+5+(1-(Y-Ymin)/qYrange)*(chartHeight-10)
				if(i==-2){
					ctx.moveTo(cX,cY)
				}else {
					ctx.lineTo(cX,cY)
				}
			}
			for(var i=102; i>=-2; i--){
				var X = i/100*(qXrange)+Xmin
//					var Y = b0+b1*X+10
				var Y = b0+b1*X+tCrit*stdError*Math.sqrt(1/n+Math.pow(X-xBar,2)/((n-1)*xVar))
				var cX = lMargin+5+((X-Xmin)/qXrange)*(chartWidth-10)
				var cY = tMargin+5+(1-(Y-Ymin)/qYrange)*(chartHeight-10)
				ctx.lineTo(cX,cY)
			}
			ctx.stroke()
			ctx.setLineDash([5, 0]);/*dashes are 5px and spaces are 3px*/

		}					
	}

	if(drawLine){
		var b0=parseFloat(document.getElementById('b0').innerHTML)
		var b1=parseFloat(document.getElementById('b1').innerHTML)
		var yStart = b0 + b1*Xmin
		var yEnd = b0 + b1*Xmax
		
		ctx.strokeStyle = "red";
		ctx.beginPath();
		ctx.moveTo(lMargin+5,tMargin+5+(1-(yStart-Ymin)/qYrange)*(chartHeight-10));
		ctx.lineTo(lMargin+5+(chartWidth-10),tMargin+5+(1-(yEnd-Ymin)/qYrange)*(chartHeight-10));
		ctx.stroke();					
	}

	if(drawLines){
		for(var k=0; k<legend.length; k++){
			ctx.beginPath()
			ctx.strokeStyle=colors[k]
//			var X=[]
//			X[+document.getElementById('groupColor').value]=legend[k]
			for(var i=0; i<=x.length; i++){
//				X[+document.getElementById('ScatterVar2').value]=(i/50)*(Xmax-Xmin)+Xmin
//				console.log(X)
				if(i==0){
					ctx.moveTo(tx(x[i]),ty(y[k][i]))
				} else {
					ctx.lineTo(tx(x[i]),ty(y[k][i]))
				}
			}
			ctx.stroke()
		}
	}
	
	if(logisticReg){
		ctx.strokeStyle = "red";
		ctx.beginPath();
		var x=Xmin
		var y=1/(1+Math.exp(-x))
		ctx.moveTo(lMargin+5,tMargin+5+(1-(y-Ymin)/qYrange)*(chartHeight-10));
		for(var x=Xmin; x<=Xmax+(qXrange*.05); x+=(qXrange/50)){
			y=1/(1+Math.exp(-x))
			ctx.lineTo(lMargin+5+(x-Xmin)/qXrange*(chartWidth-10),tMargin+5+(1-(y-Ymin)/qYrange)*(chartHeight-10));
		}
		ctx.stroke();
		ctx.beginPath();
		ctx.setLineDash([5, 3]);
		var threshProb = +document.getElementById('predictYesLevel').value
		var logOddsTresh = Math.log(threshProb/(1-threshProb))
		ctx.moveTo(lMargin+5+(logOddsTresh-Xmin)/qXrange*(chartWidth-10),tMargin+5)
		ctx.lineTo(lMargin+5+(logOddsTresh-Xmin)/qXrange*(chartWidth-10),tMargin+chartHeight-5)
		ctx.stroke();
		ctx.setLineDash([1, 0]);
	}
				
	//Draw The Dots	
	ctx.fillStyle = "rgba(0,0,0,.3)";
	ctx.strokeStyle = "black";
	for(var i=0; i<n; i++){
		var qX = (-Xmin + Xdata[i])/qXrange
		var qY = (-Ymin + Ydata[i])/qYrange
		ctx.beginPath();
		if(groups!=false){
			var cHex = colorHexes[groups[i]]
			//Set color of Fill
			ctx.fillStyle = "rgba("+hexToRgb(cHex).r +","+hexToRgb(cHex).g +","+hexToRgb(cHex).b +",.3)";
		}
		ctx.arc(tx(Xdata[i]),ty(Ydata[i]), 5*scale, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();
	}
	ctx.restore();

	if(legend.length>0){
		var cor=jStat.corrcoeff(Xdata,Ydata)
		makeLegend(ctx,lMargin+chartWidth, tMargin+(cor>0?chartHeight:0),legend, "white", "dots",cor<0, fontSizeAxis*scale)		
	}
	if(xVals.length==0){
		chartAxisX(ctx,tMargin + chartHeight,lMargin+cMargin,lMargin+chartWidth-cMargin,Xmin,Xmax,10,xLabel+(units[0]!=""?" ("+units[0]+")":""), false,[],fontSizeAxis*scale)
	} else {
//		console.log("using x values!")
		chartAxisX(ctx,tMargin + chartHeight,lMargin+cMargin,lMargin+chartWidth-cMargin,Xmin,Xmax,Math.min(xVals.length-1,10),xLabel+(units[0]!=""?" ("+units[0]+")":""),false,xVals,fontSizeAxis*scale)
	}
	chartAxisY(ctx,lMargin,tMargin+chartHeight-cMargin,tMargin+cMargin,Ymin,Ymax,10,yLabel+(units[1]!=""?" ("+units[1]+")":""), false,chartWidth,true, fontSizeAxis*scale)	
	chartTitle(ctx, "Scatter Plot", lMargin+.5*chartWidth, 0, fontSizeTitle*scale)
}

function kernel(x,y,hx,hy, method="gaussian"){
	if(method=="gaussian"){
		hx *= .96
		hy *= .96
		var t=Math.pow(x/hx,2)+Math.pow(y/hy,2)
		return (Math.exp(-t/2)/pi2)		
	} else {
		hx *= 1.77
		hy *= 1.77
		var t=Math.pow(x/hx,2)+Math.pow(y/hy,2)
		//Epanechnikov
		if(t>=1) {return 0}
		//console.log((2/Math.PI * (1-t)))
		return (2/Math.PI * (1-t))
	}
}

function renderDensity2D(x,y,ctx, kernelMethod="gaussian", grayzero=true, contours=9, canvasBounds, xyBounds, gridsize, colorHex=colorHexDark){
	var n=x.length
	var sx = jStat.stdev(x,true)
	var sy = jStat.stdev(y,true)
	var hx = Math.pow(n,-1/6)*sx
	var hy = Math.pow(n,-1/6)*sy
	var xRng=xyBounds[0]
	var yRng=xyBounds[1]
	var chartWidth = canvasBounds[0][1]-canvasBounds[0][0]
	var chartHeight = canvasBounds[1][1]-canvasBounds[1][0]

	var density = Array(Math.ceil(chartHeight/gridsize))

	var xDelta = (xRng[1]-xRng[0])/(chartWidth/gridsize)
	var yDelta = (yRng[1]-yRng[0])/(chartHeight/gridsize)

//	console.log(xDelta + " " + yDelta)
//	console.log(xRng + " " + yRng)
//	console.log(chartWidth + " " + chartHeight)
//	console.log(gridsize)

	var gridW=Math.ceil(chartWidth/gridsize), gridH=Math.ceil(chartHeight/gridsize)
	var maxDensity = 0
	//Clear the density array
	for(var i=0-1; i<=gridH+2; i++){
		density[i+1]=Array(gridW)
//		var gy=yRng[0]+yDelta*(i+.5)
		for(j=0-1; j<=gridW+2; j++){
			density[i+1][j+1]=0
//			var gx=xRng[0]+xDelta*(j+.5)
		}
	}

	var hn=3
	if(kernelMethod!="gaussian") hn=1.77

	var pX,pY
	if(typeof(spatialPrediction) != "undefined") {
		pX=predictPoint[0], pY=predictPoint[1]
		predictedDensity = 0
	}
	//Calculate Density Matrix
	for(var k=0; k<n; k++){
		var kx=Math.round((x[k]-xRng[0])/xDelta,0)
		var ky=Math.round((y[k]-yRng[0])/yDelta,0)
	//	console.log(kx+ " "+ky)
		for(var i=Math.floor(Math.max(-1, ky-hy*hn/yDelta)); i<1+Math.ceil(Math.min(gridH, ky+hy*hn/yDelta)); i++){
			var gy=yRng[0]+yDelta*(i+.5)
			var xpm  = hx*hn/xDelta*Math.sqrt(Math.max(0,1-Math.pow((i-ky)/(hy*hn/yDelta),2)))
//			console.log("xpm=" + xpm)
			for(var j=Math.floor(Math.max(-1, kx-xpm)); j<1+Math.ceil(Math.min(gridW, kx+xpm)); j++){
				var gx=xRng[0]+xDelta*(j+.5)
				density[i+1][j+1] += kernel(x[k]-gx, y[k]-gy, hx, hy, kernelMethod)	
				maxDensity = Math.max(maxDensity, density[i+1][j+1])
			}
		}
		
		if(typeof(spatialPrediction) != "undefined"){
			if(predictPoint != []){
				predictedDensity+=kernel(x[k]-pX, y[k]-pY, hx, hy, kernelMethod)	
			}
		}
		
	}
	if(typeof(spatialPrediction) != "undefined")predictedDensity /= maxDensity
//	console.log(density)

	ctx.beginPath();
	ctx.rect(canvasBounds[0][0],canvasBounds[1][0],chartWidth,chartHeight)
	ctx.clip();

	var darkRGB = hexToRgb(colorHex)
	
	for(var i=0-1; i<=gridH+2; i++){
		for(j=0-1; j<=gridW+2; j++){
			var p=density[i+1][j+1]/maxDensity
			var cellColor="#DDD"
			if(p>=.0005) cellColor="#EEE"
			if(!grayzero) cellColor="white"
			if(p>=.001) cellColor='rgba('+(p*darkRGB.r+(1-p)*255)+','+(p*darkRGB.g+(1-p)*255)+','+(p*darkRGB.b+(1-p)*255)+',1)'	

			ctx.beginPath()
			ctx.rect(canvasBounds[0][0]+j*gridsize,canvasBounds[1][0]+chartHeight-(i+1)*gridsize, gridsize+1, gridsize+1)
			ctx.fillStyle=cellColor
			ctx.fill()
		}
	}
	
	if(contours>0){
		var nContours = contours;
		
	//	var start = new Date().getTime();
		//New Method
		ctx.beginPath()
//		ctx.strokeStyle="blue"
//		ctx.lineWidth=3
		for(k=0; k<nContours; k++){
			var p=(k+1)/(nContours+1)*maxDensity
			for(var i=-1; i<gridW+1; i++){
				for(var j=-1; j<gridH+1; j++){
					var ddiffA=density[j+1][i+1]-p
					var ddiffB=density[j+1][i+2]-p
					var ddiffC=density[j+2][i+1]-p
					var ddiffD=density[j+2][i+2]-p
					var signA = Math.sign(ddiffA)
					var signB = Math.sign(ddiffB)
					var signC = Math.sign(ddiffC)
					var signD = Math.sign(ddiffD)
					
					//console.log(i+" "+j+" "+ddiffA)
					
//					if(signA!=signB || signA!=signC || signA!=signD){
					if(ddiffA*ddiffB<0 || ddiffA*ddiffC<0 || ddiffA*ddiffD<0){
	//					console.log("edge at "+i+","+j)
	//					console.log(signA + " " +signB + " "+signC +" "+signC)
						var segs=[[false,false,false],[false,false],[false]]
						
						var a=Math.abs(ddiffA), b=Math.abs(ddiffB), c=Math.abs(ddiffC),d=Math.abs(ddiffD)
						
						if(ddiffA*ddiffB<0){
							if(ddiffA*ddiffC>0 && ddiffC*ddiffD<0){
								//1 to 3
								segs[0][1]=true
							}else if(ddiffA*ddiffC<0 && ddiffC*ddiffD>0){
								//1 to 2
								segs[0][0]=true
							}else if(signA==signC && signC==signD){
								//1 to 4
								segs[0][2]=true
							} else if(signA==signD && signB==signC){
								
								//if(Math.sqrt(Math.pow(a/(a+c),2)+Math.pow(a/(a+b),2)) < Math.sqrt(Math.pow(b/(b+d),2)+Math.pow(b/(a+b),2))){
								if(Math.sign(ddiffA+ddiffB+ddiffC+ddiffD)==signB){
								//1 to 2  & 3 to 4
									segs[0][0]=true
									segs[2][0]=true
								} else {
								// OR 1 to 4 and 2 to 3, whichever is closer
									segs[0][2]=true
									segs[1][0]=true
								}
							}
						}else{
							if(signA==signD){
								//2 to 3
								segs[1][0]=true
							}else if(signA==signB && signC==signD){
								//2 to 4
								segs[1][1]=true
							} else {
								//3 to 4
								segs[2][0]=true
							}
						}
						//console.log("segs="+segs)
						if(segs[0][0] || segs[0][1] || segs[0][2]){
							var p1=[i+a/(a+b), j]
							var p2=[i, j+a/(a+c)]
							if(segs[0][1]){
								p2=[i+c/(c+d), j+1]
							}else if(segs[0][2]){
								p2=[i+1, j+b/(b+d)]
							}
							//draw line from p1 to p2
							ctx.moveTo(canvasBounds[0][0]+(p1[0]+.5)*gridsize, canvasBounds[1][0]+chartHeight-(p1[1]+.5)*gridsize)
							ctx.lineTo(canvasBounds[0][0]+(p2[0]+.5)*gridsize, canvasBounds[1][0]+chartHeight-(p2[1]+.5)*gridsize)
						}
						if(segs[1][0] || segs[1][1]){
							var p1=[i,j+a/(a+c)]
							var p2=[i+c/(c+d),j+1]
							if(segs[1][1]) p2=[i+1, j+b/(b+d)]
							ctx.moveTo(canvasBounds[0][0]+(p1[0]+.5)*gridsize, canvasBounds[1][0]+chartHeight-(p1[1]+.5)*gridsize)
							ctx.lineTo(canvasBounds[0][0]+(p2[0]+.5)*gridsize, canvasBounds[1][0]+chartHeight-(p2[1]+.5)*gridsize)
						} else if (segs[2][0]){
							var p1=[i+c/(c+d),j+1]
							var p2=[i+1, j+b/(b+d)]
							ctx.moveTo(canvasBounds[0][0]+(p1[0]+.5)*gridsize, canvasBounds[1][0]+chartHeight-(p1[1]+.5)*gridsize)
							ctx.lineTo(canvasBounds[0][0]+(p2[0]+.5)*gridsize, canvasBounds[1][0]+chartHeight-(p2[1]+.5)*gridsize)
						}
					}
				}
			}
		}
		ctx.stroke()
	}	
	//console.log(density)
	return density
	
}

function densityPlot2d(x, y, canvasID, kernelMethod="gaussian",grayzero=true, contours=9, marginals=false, Xvar, Yvar){
	if (!isOpen("headerDensity2d")) return false;
	var c=document.getElementById(canvasID)
	var ctx=c.getContext("2d")
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	ctx.save();
	var scale=c.width/480
	var lMargin = 50*scale
	var rMargin = (20+(marginals?50:0))*scale
	var tMargin = (30+(marginals?50:0))*scale
	var bMargin = 35*scale
	var axisMargin = 5
	var chartHeight=c.height - bMargin-tMargin-axisMargin
	var chartWidth=c.width - lMargin-rMargin-axisMargin

	var gridsize=+document.getElementById("k2dRes").value

	var n=x.length
	var sx = jStat.stdev(x,true)
	var sy = jStat.stdev(y,true)
	var hx = Math.pow(n,-1/6)*sx
	var hy = Math.pow(n,-1/6)*sy

	var xRng=[jStat.min(x)-2*hx,jStat.max(x)+2*hx]
	var yRng=[jStat.min(y)-2*hy,jStat.max(y)+2*hy]


	var canvasBounds = []
	canvasBounds[0]=[lMargin,lMargin+chartWidth]
	canvasBounds[1]=[tMargin, tMargin+chartHeight]
	var xyBounds=[]
	xyBounds[0]=xRng
	xyBounds[1]=yRng
	var density=renderDensity2D(x,y,ctx, kernelMethod, grayzero, contours, canvasBounds, xyBounds, gridsize)

	ctx.restore();

	if(marginals){
		var marginalDensities=[]
		var maxMarginalDensity=0
		for(var j=0; j<density[0].length; j++){
			marginalDensities[j]=0
			for(var i=0; i<density.length;i++){
				marginalDensities[j]+=density[i][j]
			}
			maxMarginalDensity=Math.max(maxMarginalDensity,marginalDensities[j])
		}
//		console.log(marginalDensities)
		ctx.beginPath()
		ctx.moveTo(lMargin,tMargin-5)
		ctx.strokeStyle="black"
		for(var i=0; i<marginalDensities.length-2;i++){
			ctx.lineTo((i)/(marginalDensities.length-1)*chartWidth+lMargin,tMargin-(marginalDensities[i]/maxMarginalDensity)*45-5)
		}
		ctx.lineTo(lMargin+chartWidth,tMargin-5)
		ctx.fillStyle=colorHex
		ctx.fill()
		ctx.stroke()

		var marginalDensities=[]
		var maxMarginalDensity=0
		for(var i=0; i<density.length; i++){
			marginalDensities[i]=0
			for(var j=0; j<density[0].length; j++){
				marginalDensities[i]+=density[i][j]
			}
			maxMarginalDensity=Math.max(maxMarginalDensity,marginalDensities[i])
		}
//		console.log(marginalDensities)

		ctx.beginPath()
		ctx.moveTo(lMargin+chartWidth+5,tMargin+chartHeight)
		ctx.strokeStyle="black"
		for(var i=0; i<marginalDensities.length-1;i++){
			ctx.lineTo(lMargin+chartWidth+5+(marginalDensities[i]/maxMarginalDensity)*45,tMargin+(1-(i)/(marginalDensities.length-1))*chartHeight)
		}
		ctx.lineTo(lMargin+chartWidth+5,tMargin)
		ctx.fillStyle=colorHex
		ctx.fill()
		ctx.stroke()
	}



	ctx.beginPath();
	ctx.moveTo(lMargin-axisMargin,tMargin);
	ctx.lineTo(lMargin-axisMargin,tMargin+chartHeight+axisMargin);
	ctx.lineTo(lMargin+chartWidth,tMargin+chartHeight+axisMargin);
	ctx.stroke();

/*	
	ctx.textAlign="center"
	ctx.fillStyle = "black";
	for (var i =0; i<=10; i++) {
		var x=lMargin+5-axisMargin + ((i*(xRng[1]-xRng[0])/10)/(xRng[1]-xRng[0])) * (chartWidth-10+axisMargin*2)
		var y = tMargin + chartHeight+axisMargin
		ctx.beginPath()
		ctx.moveTo(x,y)
		ctx.lineTo(x,y+5)
		ctx.stroke()
		//alert(Xmin+" "+qXrange)
		var xlab = (+xRng[0]+i*(xRng[1]-xRng[0])/10.0).toFixed(1)
		ctx.fillText(xlab, x, y+15);
	}	
	
	for (var i =yRng[0]; i<=yRng[1]; i+=(yRng[1]-yRng[0])/10) {
		var y=tMargin-axisMargin + 5+((yRng[1] - i)/(yRng[1]-yRng[0])) * (chartHeight-10+axisMargin*2)
		var x = lMargin-axisMargin
		ctx.moveTo(x,y)
		ctx.lineTo(x-5,y)
		var xlab = (+i).toFixed(1)
		ctx.textAlign="end"
		ctx.textBaseline = "middle"
		ctx.fillText(xlab, x-6, y);
		ctx.stroke()
	}	
*/

	var units = [document.getElementById('units1').value,document.getElementById('units2').value]	
	chartTitle(ctx, "Kernel Density Plot", lMargin+.5*chartWidth, 0, fontSizeTitle*scale)
	chartAxisY(ctx,lMargin-5,tMargin+chartHeight,tMargin,yRng[0],yRng[1],10,document.getElementById("name"+Yvar).value+(units[1]!=""?" ("+units[1]+")":""), false,chartWidth,true, fontSizeAxis*scale)	
	chartAxisX(ctx,tMargin + chartHeight+5,lMargin,lMargin+chartWidth,xRng[0],xRng[1],10,document.getElementById("name"+Xvar).value+(units[0]!=""?" ("+units[0]+")":""), false,[],fontSizeAxis*scale)


}

function edist(pt0, pt1){
	return Math.sqrt(Math.pow(pt0[0]-pt1[0],2)+Math.pow(pt0[1]-pt1[1],2))
}

function bagPlot(x,y,canvasID,Xvar=1,Yvar=2){
	if (!isOpen("headerBagPlot")) return false
	//console.log("x="+x)
	//console.log("y="+y)
	var c=document.getElementById(canvasID)
	var ctx=c.getContext("2d")
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);
	ctx.save();
	var scale = c.width/480
	var lMargin = 50*scale
	var rMargin = 20*scale
	var tMargin = 30*scale
	var bMargin = 35*scale
	var axisMargin = 5
	var chartHeight=c.height - bMargin-tMargin-axisMargin
	var chartWidth=c.width - lMargin-rMargin-axisMargin

	var n=x.length
	var Xmin = +jStat.min(x),Xmax = +jStat.max(x)
	var Ymin = +jStat.min(y),Ymax = +jStat.max(y)
	var outlier=[]
	var sx=jStat.stdev(x,true), sy=jStat.stdev(y,true)
	var xbar=jStat.mean(x), ybar=jStat.mean(y)
	var xz=Array(n),yz=Array(n)
	for(var i=0; i<n; i++){
		outlier[i]=true
		xz[i]=(x[i]-xbar)/sx
		yz[i]=(y[i]-ybar)/sy
	}

	
	//-------------------- CREATE THE ANGLE MATRIX ---------------------
	var angleTo = Array(n)
	var pointsOn = Array(n)
	var consoleCount=0
	for(var i=0; i<n; i++){
		angleTo[i]=Array(n)
		pointsOn[i]=0
		for(var j=0; j<n; j++){
			if(i==j || xz[i]==xz[j] && yz[i]==yz[j]){
				angleTo[i][j]=-1
				pointsOn[i]++
			} else {
				angleTo[i][j]=Math.atan2(xz[j]-xz[i],yz[j]-yz[i])%(pi2)
				if(angleTo[i][j]<0) angleTo[i][j] += pi2
			}
			if(consoleCount<10){
				consoleCount++;
//				console.log(x[i]+","+y[i]+" to "+x[j]+","+y[j]+" : "+angleTo[i][j])
			}
		}
	}
//	console.log(angleTo[1])

	//---------------------------- CALCULATE TUKEY DEPTHS of all points ----------------
	depth=Array(n)
	var maxDepth=0
	for(var i=0; i<n; i++){
		//count how many points have the angleTo mod 2Pi < pi
		depth[i]=n
		//If n>200
		for(var angle=0; n>=200 && angle<pi2; angle+=pi2/30){
			var newDepth = 0
			for(var k=0; k<n; k++){
				if(k!=j && angleTo[i][k]!=-1){
					var angleDiff = (2*pi2+angle-angleTo[i][k])%(pi2)
					if(angleDiff < Math.PI) newDepth++
				}
			}
			newDepth = Math.min(newDepth, n-pointsOn[i]-newDepth) + pointsOn[i]
			depth[i]=Math.min(depth[i], newDepth)
		}		
		for(var j=0; n<200&& j<n; j++){
			if(angleTo[i][j]!=-1){	
				var angle = (angleTo[i][j]+.00000001)
				var newDepth = 0
				for(var k=0; k<n; k++){
					if(k!=j && angleTo[i][k]!=-1){
						var angleDiff = (2*pi2+ angleTo[i][k]-angle)%(pi2)
						if(angleDiff < Math.PI) newDepth++
					}
				}
				newDepth = Math.min(newDepth, n-pointsOn[i]-newDepth) + pointsOn[i]
				depth[i]=Math.min(depth[i], newDepth)
//				if(x[i]<1200) console.log( x[i]+","+y[i]+" "+depth[i])
			}
		}
		maxDepth = Math.max(maxDepth, depth[i])
	}
	//console.log(depth)	

	//--------------------------- CALCULATE BAG DEPTH ---------------------------------
	var percentile10 = 0
	var percentile20 = 0
	var percentile50 = 0
	var percentile60 = 0

//	console.log(maxDepth)
	
	var	depthCounts=[]
	for(var i=0; i<maxDepth; i++) depthCounts[i]=0
//	console.log(depth)
	for(var i=0; i<n; i++){
		depthCounts[depth[i]-1]++
	}
//	console.log(depthCounts)
	var cCount=0
	for(var i=0; i<depthCounts.length; i++){
		cCount += depthCounts[i]
		if(percentile10==0 && cCount > .10*n) percentile10 = i+1
		if(percentile20==0 && cCount > .2*n) percentile20 = i+1
		if(percentile50==0 && cCount > .5*n) percentile50 = i+1
		if(percentile60==0 && cCount > .6*n) percentile60 = i+1
	}

	var bagdepth=percentile50

//	console.log(percentile60)
//	console.log(percentile50)	
//	console.log(percentile10)

	//---------------------------- Figure out which points are in the bag ------------- 
	var bag=[], bagPtUsed = []
	for(var i=0; i<n; i++){
		if(depth[i]>=bagdepth && (n<200 || n>=200 && depth[i]<percentile60)){bag.push(i)}
	}
	var bagHull = getHullIndices(bag, x, y)

//	console.log("bag has "+bag.length+" points")

	//---------------------------- get the approximate median point -------------------
	var deepest=[]
	var deepestDepth=0
	for(var i=0; i<n; i++){if(depth[i]>deepestDepth) deepestDepth=depth[i]}
	for(var i=0; i<n; i++){
		if(depth[i]==deepestDepth) deepest.push(i)
	}
	//console.log("deepest="+deepest)
	var xmed = median(x.slice(0))
	var ymed = median(y.slice(0))
	//console.log(xmed + ","+ymed)
	medDepth = tukeyDepth(xmed,ymed,x,y)

	var stepCount =0
	while(medDepth < deepestDepth && stepCount<10){
		//console.log("going closer")
		xmed = (xmed+x[deepest[0]])/2
		ymed = (ymed+y[deepest[0]])/2
		medDepth = tukeyDepth((xmed-xbar)/sx,(ymed-ybar)/sy,xz,yz)
//		console.log("median depth = "+medDepth)
		stepCount++
	}


	//----------------------------- calculate the fence -------------------------
	var fence=[], fenceX=[], fenceY=[]
	var fenceScalar=3
	for(var i=0; i<bagHull.length; i++){
		fenceX.push(xmed+(x[bagHull[i]]-xmed)*fenceScalar)
		fenceY.push(ymed+(y[bagHull[i]]-ymed)*fenceScalar)	
	}

	//------------------------------ which points are in the fence? --------------
	var inFence=[], fencePtUsed = []
	for(var i=0; i<n; i++){
		if(checkcheck(x[i],y[i],fenceX,fenceY)) {
			if(n<50 || n>=50 && n<200 && depth[i]<=percentile50 ||  n>=200 && depth[i]<=percentile20) inFence.push(i)
			outlier[i]=false
		}
	}
	var fenceHull=getHullIndices(inFence,x,y)

	xRng=[jStat.min(x),jStat.max(x)]
	yRng=[jStat.min(y),jStat.max(y)]

	ctx.beginPath();
	ctx.rect(lMargin-axisMargin,tMargin-axisMargin,chartWidth+axisMargin*2,chartHeight+axisMargin*2)
	ctx.clip();

	var darkRGB = hexToRgb(colorHex)
	var p=.6
	var bagColor = 'rgba('+(p*darkRGB.r+(1-p)*255)+','+(p*darkRGB.g+(1-p)*255)+','+(p*darkRGB.b+(1-p)*255)+',1)'
	p=1
	var bagBorderColor = 'rgba('+(p*darkRGB.r+(1-p)*255)+','+(p*darkRGB.g+(1-p)*255)+','+(p*darkRGB.b+(1-p)*255)+',1)'
	p=.3
	var loopColor = 'rgba('+(p*darkRGB.r+(1-p)*255)+','+(p*darkRGB.g+(1-p)*255)+','+(p*darkRGB.b+(1-p)*255)+',1)'
	
	//---------------- draw the loop -------------
	ctx.beginPath()
	ctx.moveTo((x[fenceHull[fenceHull.length-1]]-xRng[0])/(xRng[1]-xRng[0])*chartWidth+lMargin,
				tMargin+chartHeight*(yRng[1]-y[fenceHull[fenceHull.length-1]])/(yRng[1]-yRng[0]))
	for(var i=0; i<fenceHull.length; i++){ctx.lineTo((x[fenceHull[i]]-xRng[0])/(xRng[1]-xRng[0])*chartWidth+lMargin,
				tMargin+chartHeight*(yRng[1]-y[fenceHull[i]])/(yRng[1]-yRng[0]))}
	ctx.fillStyle = loopColor
	ctx.fill()

	//----------------- draw the bag -------------
	ctx.beginPath()
	ctx.moveTo((x[bagHull[bagHull.length-1]]-xRng[0])/(xRng[1]-xRng[0])*chartWidth+lMargin,
				tMargin+chartHeight*(yRng[1]-y[bagHull[bagHull.length-1]])/(yRng[1]-yRng[0]))
	for(var i=0; i<bagHull.length; i++){ctx.lineTo((x[bagHull[i]]-xRng[0])/(xRng[1]-xRng[0])*chartWidth+lMargin,
				tMargin+chartHeight*(yRng[1]-y[bagHull[i]])/(yRng[1]-yRng[0]))}
	ctx.fillStyle = bagColor
	ctx.strokeStyle = bagBorderColor
	ctx.fill();
	ctx.stroke();

	//------------------ draw the median circle ---
	var deepestRad=0
	//console.log("deepest = "+deepest)
	for(var i=0; i<deepest.length; i++){
		var rad=Math.sqrt(Math.pow(chartWidth/(xRng[1]-xRng[0])*(xmed-x[deepest[i]]),2)+Math.pow(chartHeight/(yRng[1]-yRng[0])*(ymed-y[deepest[i]]),2))
		if(i==0 || rad < deepestRad) deepestRad = rad
	}
	//console.log("radius = "+deepestRad)
	if(deepestRad<10) deepestRad=10
	ctx.beginPath()
	ctx.fillStyle="white"
	ctx.arc((xmed-xRng[0])/(xRng[1]-xRng[0])*chartWidth+lMargin,
				tMargin+chartHeight*(yRng[1]-ymed)/(yRng[1]-yRng[0]),deepestRad,0,pi2)
	ctx.fill()
	ctx.stroke()

	//------------------ draw the points ----------
	ctx.fillStyle = "black"
	var dotScale =1.0
	if(n>200) dotScale=.75
	if(n>500) dotScale=.5
	ctx.beginPath();
	for(var i=0; i<n; i++){
		ctx.beginPath()
		if(!outlier[i]){ctx.arc((x[i]-xRng[0])/(xRng[1]-xRng[0])*chartWidth+lMargin,
				tMargin+chartHeight*(yRng[1]-y[i])/(yRng[1]-yRng[0]),2*dotScale*scale,0,pi2)
		}else{ strokeStar((x[i]-xRng[0])/(xRng[1]-xRng[0])*chartWidth+lMargin,
				tMargin+chartHeight*(yRng[1]-y[i])/(yRng[1]-yRng[0]),2*scale,5,2,ctx)
		}
		ctx.fill()
	}
	
	ctx.restore();
	ctx.beginPath();
	ctx.moveTo(lMargin-axisMargin,tMargin);
	ctx.lineTo(lMargin-axisMargin,tMargin+chartHeight+axisMargin);
	ctx.lineTo(lMargin+chartWidth,tMargin+chartHeight+axisMargin);
	ctx.stroke();	
	ctx.textAlign="center"
	ctx.fillStyle = "black";

	var units = [document.getElementById('units'+Xvar).value,document.getElementById('units'+Yvar).value]
	chartTitle(ctx, "Bag Plot", lMargin+.5*chartWidth, 0, fontSizeTitle*scale)
//	console.log(yRng)
	chartAxisY(ctx,lMargin-5,tMargin+chartHeight,tMargin,yRng[0],yRng[1],10,document.getElementById("name"+Yvar).value+(units[1]!=""?" ("+units[1]+")":""), false,chartWidth,true, fontSizeAxis*scale)	

	chartAxisX(ctx,tMargin + chartHeight+5,lMargin,lMargin+chartWidth,Xmin,Xmax,10,document.getElementById("name"+Xvar).value+(units[0]!=""?" ("+units[0]+")":""), false,[],fontSizeAxis*scale)	
}

function tukeyDepth(x0,y0,xs,ys){
	var n=xs.length
	var angleTo = Array(n)
	var pointsOn=0
	for(var i=0; i<n; i++){
		if(xs[i]==x0 && ys[i]==y0){
			angleTo[i]=-1
			pointsOn++
		} else {
			angleTo[i]=Math.atan2(ys[i]-y0,xs[i]-x0)
			if(angleTo[i]<0) angleTo[i]+=pi2
		}
	}
	var depth0=n
	for(var j=0; j<n; j++){
		if(angleTo[j]!=-1){	
			var angle = (angleTo[j]+.00000001+Math.PI/2)%pi2
			var newDepth = 0
			for(var k=0; k<n; k++){
				if(k!=j && angleTo[k]!=-1){
					var angleDiff = (angleTo[k]-angle)%(pi2)
					if(angleDiff<0) angleDiff += pi2
					angleDiff = Math.abs(angleDiff-Math.PI)
					if(angleDiff > Math.PI/2) newDepth++
				}
			}
			newDepth = Math.min(newDepth, n-pointsOn-newDepth) + pointsOn
			depth0=Math.min(depth0, newDepth)
		}
	}
	return(depth0)
}

function checkcheck (x, y, cornersX, cornersY) {
  let inside = false
  for (let i = 0, j = cornersX.length - 1; i < cornersY.length; j = i++) {
    let xi = cornersX[i]
    let yi = cornersY[i]
    let xj = cornersX[j]
    let yj = cornersY[j]
    let intersect = ((yi > y) !== (yj > y)) &&
                    (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }

  return inside
	
}

function strokeStar(x, y, r, n, inset, ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.moveTo(0,0-r);
    for (var i = 0; i < n; i++) {
        ctx.rotate(Math.PI / n);
        ctx.lineTo(0, 0 - (r*inset));
        ctx.rotate(Math.PI / n);
        ctx.lineTo(0, 0 - r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function getHullIndices(S, x, y){
	var hull=[]
	var firstPoint = S[0]
	var setPtUsed=[]
	for(var i=0; i<S.length; i++){
		setPtUsed[i]=false
		if(y[S[i]] > y[firstPoint]) firstPoint=S[i]
		if(y[S[i]] == y[firstPoint] && x[S[i]]<=x[firstPoint]) firstPoint=S[i]		
	}
	var curIdx = firstPoint
	var nextIdx = -1
	var prevIdx =0 
	while(nextIdx != firstPoint && hull.length<S.length){
		hull.push(curIdx)
		var minAngle=4
		var angleLim = Math.atan2(y[curIdx]-y[prevIdx],x[curIdx]-x[prevIdx])
		if(prevIdx==0) angleLim = -4
		var SIdx=-1
		for(var i=0; i<S.length; i++){
			if(!setPtUsed[i] && S[i]!=curIdx){
				var angle = Math.atan2(y[S[i]]-y[curIdx],x[S[i]]-x[curIdx])
				if(angle<minAngle && angle >=angleLim){
					minAngle = angle
					nextIdx=S[i]
					SIdx=i
				}
			}
		}
		setPtUsed[SIdx]=true	
		prevIdx=curIdx
		curIdx=nextIdx
	}	
	return hull
}

//----------------------------------------------------------
//   RESIDUAL PLOT
//----------------------------------------------------------
function residualplot(Xdata, xLabel="", absValue=false, xLabels=[],Xvar=1) {
	var c=document.getElementById("residualplot")
	var ctx=c.getContext("2d")
	ctx.font = "12px sans-serif";
	ctx.save();
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c.width, c.height);	
	var scale = c.width/480
	var lMargin=50*scale
	var rMargin=15*scale
	var tMargin=20*scale
	var bMargin=30*scale
	var chartWidth = c.width-lMargin-rMargin
	var chartHeight = c.height-tMargin-bMargin

	//	alert(Xdata)
	var n = Xdata.length
	for(var i=0; i<n; i++) { Xdata[i] = +Xdata[i]; }
	//var residuals = window.Resid
	
	var resids=residuals.slice()
	if(absValue){
		for(var i=0; i<resids.length; i++) resids[i]=Math.abs(resids[i])
	}
	var Xmin = jStat.min(Xdata)
	var Xmax = jStat.max(Xdata)
	var Ymin = jStat.min(resids)
	var Ymax = jStat.max(resids)
	for(var i=0; i<n; i++){
		if(Xdata[i]>Xmax) Xmax = Xdata[i];
		if(Xdata[i]<Xmin) Xmin = Xdata[i];
		if(resids[i]>Ymax) Ymax = resids[i];
		if(resids[i]<Ymin) Ymin = resids[i];
	}
	var Yrange = Ymax - Ymin
	var Xrange = Xmax - Xmin
	
	var xMargin = (xLabels.length>0?chartWidth/(xLabels.length*2):0)
	
	ctx.beginPath();
	ctx.rect(lMargin,tMargin,chartWidth,chartHeight)
	ctx.clip();

	var LOESS=xLabels.length==0
	var LOESSres = 25
	if(LOESS){
		var bandwidth=(Xmax-Xmin)/2
		ctx.strokeStyle="red";
		ctx.beginPath()
		var lineStarted=false
		for(var i=0; i<=LOESSres; i++){
			var x=i/LOESSres*(Xmax-Xmin)+Xmin
			var sumWeights=0
			var y=0
			for(j=0; j<Xdata.length; j++){
				var dist=Math.abs(Xdata[j]-x)
				if(dist<=bandwidth){
					var weight = triCubic(dist,bandwidth)
					sumWeights+=weight
					y+=weight*resids[j]
				}
			}
			if(sumWeights>0){
				y = y/sumWeights
				var X = (-Xmin + x)/Xrange
				var Y = (-Ymin + y)/Yrange
				if(!lineStarted){
					ctx.moveTo(lMargin+5+xMargin+(X)*(chartWidth-2*xMargin-10),tMargin+5+(1-Y)*(chartHeight-10))
					lineStarted=true
				} else {
					ctx.lineTo(lMargin+5+xMargin+(X)*(chartWidth-2*xMargin-10),tMargin+5+(1-Y)*(chartHeight-10))
				}
			}
			
		}
		ctx.stroke()
	}
	
	ctx.strokeStyle = "black";
	ctx.fillStyle = "#000000";
	if(n>=100) ctx.fillStyle= 'rgba(0,0,0,.3)'
	var dotRadius=(n<100?2:4)

	for(var i=0; i<n; i++){
		var X = (-Xmin + Xdata[i])/Xrange
		var Y = (-Ymin + resids[i])/Yrange
		ctx.beginPath();
		ctx.arc(lMargin+5+xMargin+(X)*(chartWidth-2*xMargin-10),tMargin+5+(1-Y)*(chartHeight-10), dotRadius, 0, 2 * Math.PI);
		ctx.fill();
		if(n<100) ctx.stroke();
	}
	

	ctx.beginPath();
	ctx.setLineDash([5,5]);
	ctx.moveTo(lMargin+5,tMargin+5+(1-(-Ymin/Yrange))*(chartHeight-10));
	ctx.lineTo(lMargin+5+(chartWidth-10),tMargin+5+(1-(-Ymin/Yrange))*(chartHeight-10));
	ctx.stroke();	
	ctx.setLineDash([5,0]);
	//ctx.font = "12px sans-serif";

	ctx.restore();


/*
	if(xLabels.length==0){
		chartAxisX(ctx,tMargin + chartHeight,lMargin,lMargin+chartWidth,Xmin,Xmax,10,xLabel)
	} else {
//		console.log("using x values!")
		chartAxisX(ctx,tMargin + chartHeight,lMargin+chartWidth/(xLabels.length*2),lMargin+(1-1/(xLabels.length*2))*chartWidth,Xmin,Xmax,xLabels.length-1,xLabel,false,xLabels)
	}
	chartAxisY(ctx,lMargin,tMargin+chartHeight-5,tMargin+5,Ymin,Ymax,10,"Residual")	
	chartTitle(ctx, "Residual Plot", lMargin+.5*chartWidth, tMargin/2)	
*/	
	var units = exists('units1')?[document.getElementById('units'+Xvar).value,document.getElementById('units'+(3-Xvar)).value]:["",""]

	if(xLabels.length==0){
		chartAxisX(ctx,tMargin + chartHeight,lMargin,lMargin+chartWidth,Xmin,Xmax,10,xLabel+(units[0]!=""?" ("+units[0]+")":""), false,[],fontSizeAxis*scale)
	} else {
//		console.log("using x values!")
		chartAxisX(ctx,tMargin + chartHeight,lMargin+chartWidth/(xLabels.length*2),lMargin+(1-1/(xLabels.length*2))*chartWidth,Xmin,Xmax,xVals.length-1,xLabel+(units[0]!=""?" ("+units[0]+")":""),false,xVals,fontSizeAxis*scale)
	}
	chartAxisY(ctx,lMargin,tMargin+chartHeight,tMargin,Ymin,Ymax,10,"Residual"+(units[1]!=""?" ("+units[1]+")":""), false,chartWidth,true, fontSizeAxis*scale)	
	chartTitle(ctx, "Residual Plot", lMargin+.5*chartWidth, 0, fontSizeTitle*scale)
	
	
	
	
}

function triCubic(distance, bandwidth){
	var distStd = distance/bandwidth
	return (distance>bandwidth?0:Math.pow(1-Math.pow(distStd,3),3))
}



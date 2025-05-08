// ------------ COMMON SETTINGS ------------- //
var precision = 4
var qualitative = false
var colorChoice = -1
var pi2=Math.PI*2
var debug=false

function setPrecision(newPrecision){
	precision = newPrecision;
	if (typeof(Storage) !== "undefined") {
		localStorage.setItem("PRECISION",precision);
	} 
}
function loadPrecision(){
	if (typeof(Storage) !== "undefined") {
		var loadedPrecision = localStorage.getItem("PRECISION");
		if (typeof loadedPrecision !== 'undefined' && loadedPrecision !== null) {
			precision = loadedPrecision;
		}
	} 
}

function loadColorChoice(){
	if (typeof(Storage) !== "undefined") {
		var loadedColorChoice = localStorage.getItem("COLORCHOICE");
		if (typeof loadedColorChoice !== 'undefined' && loadedColorChoice !== null) {
			colorChoice = loadedColorChoice;
		}
	} 
}

var histOptions = ["Freedman-Diachonis' choice","Square-Root of n", "Sturges' formula", "Rice Rule","Doane's formula","Scott's normal reference rule","4","5","6",
				   "7","8","9","10","11","12","13","14","15","16","17","18","19","20"]
var histOptionValues = ["fd","sqrt", "sturges", "rice","doanes","scotts",4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]


// ------------ COLOR FUNCTIONS ------------- //

let colorHex = ""
let colorHexLite = ""
let colorHexDark = ""
var colors = ['red','blue','green','yellow','MediumPurple','orange','DeepSkyBlue','Pink','Gold','LimeGreen','SaddleBrown','White','Gray','Black']
var colorsFont = ['black','white','black','black','black','black','black','black','black','black','black','black','black','white']
var colorHexes = ['#FF0000','#0000FF','#008000','#FFFF00','#9F79EE','#FFA500','#00BFFF','#FFC0CB','#FFD700','#32CD32','#8B4513','#FFFFFF','#808080','#000000']
var colorChoices = ["DarkRed","Red","orangered","darkorange","orange","gold","yellow","greenyellow","lime","limegreen","green","seagreen","teal","cyan","powderblue","lightskyblue","deepskyblue","dodgerblue","blue","navy","indigo","blueviolet","magenta","deeppink","hotpink","pink","burlywood","peru","saddlebrown"]
var labelColors=[0,1,2,3,4,5,6,7,8,9,10,11,12]
var customColors = colors.slice()


function hslRGB(H,S,V){
	var C = V*S
	var X = C*(1-Math.abs(H%2-1))
	var color1 = "#"
	if (H<=1) 		{color1 = colorString(C,X,0)}
	else if (H<=2)	{color1 = colorString(X,C,0)}
	else if (H<=3)	{color1 = colorString(0,C,X)}
	else if (H<=4)	{color1 = colorString(0,X,C)}
	else if (H<=5)	{color1 = colorString(X,0,C)}
	else			{color1 = colorString(C,0,X)}
	return color1
}	

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function setColors(){
	if(colorChoice==-1){
		var H = Math.random() * 6.0
		var whiteness=.5
		var color1 = hslRGB(H,1,.5)
		var color2 = hslRGB(H,1,.75)
		var color3 = hslRGB(H,1,1)
		document.getElementById("title").style.backgroundColor = color1
		document.getElementById("container").style.backgroundColor = color2
		document.getElementById("menu").style.backgroundColor = color2
		colorHex = color1
		colorHexDark = color3
		colorHexLite = colorString( (1-whiteness)*hexToRgb(color1).r/255 + whiteness, (1-whiteness)*hexToRgb(color1).g/255 + whiteness, (1-whiteness)*hexToRgb(color1).b/255 + whiteness)
	} else {
		refreshColors(colorChoice)
	}
}

function colorString(r,g,b){
	return rgbToHex(Math.round(r*255),Math.round(g*255),Math.round(b*255))
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) +componentToHex(b);
}

function colorToRGBA(color) {
    // Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
    // color must be a valid canvas fillStyle. This will cover most anything
    // you'd want to use.
    // Examples:
    // colorToRGBA('red')  # [255, 0, 0, 255]
    // colorToRGBA('#f00') # [255, 0, 0, 255]
    var cvs, ctx;
    cvs = document.createElement('canvas');
    cvs.height = 1;
    cvs.width = 1;
    ctx = cvs.getContext('2d');
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    return ctx.getImageData(0, 0, 1, 1).data;
}

// ------------ DATA FUNCTIONS ------------- //
function isFloat(n) {
    return n === +n && n !== (n|0);
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}		

function getPrecision(a) {
  var p = -10;
  while (Math.round(a * Math.pow(10,p)) / Math.pow(10,p) !== a) p++;
  return Math.round(Math.log(Math.pow(10,p)) / Math.LN10);
}

function fixed(number, places=precision){
	return parseFloat(number.toFixed(Math.max(0,places)))
}

function filledArray(n, v){
	var newArray = []
	for(var i=0; i<n; i++)newArray.push(v)
	return newArray
}

function fiveNumSum(data){
	var fiveNumSumArray = new Array(5);
	var n=data.length;
	fiveNumSumArray[0]= +jStat.min(data);
	fiveNumSumArray[2]= +jStat.median(data);
	fiveNumSumArray[4]= +jStat.max(data);
	if (n%4 ==0){
		fiveNumSumArray[1]= .5*data[n/4-1] + .5*data[n/4];
		fiveNumSumArray[3] = .5*data[3*n/4-1] + .5*data[3*n/4];
	} else if (n%4==2) {
		fiveNumSumArray[1] = data[(n+2)/4-1];
		fiveNumSumArray[3] = data[3*(n+2)/4-2];
	} else if (n%4==1){
		fiveNumSumArray[1] = .25*data[(n-1)/4-1]+.75*data[(n-1)/4];
		fiveNumSumArray[3] = .75*data[3*(n-1)/4] + .25*data[3*(n-1)/4+1];
	} else {
		fiveNumSumArray[1] = .75*data[(n-3)/4]+.25*data[(n-3)/4+1];
		fiveNumSumArray[3] = .25*data[3*(n-3)/4+2] + .75*data[3*(n-3)/4+3];
	}
	return fiveNumSumArray;
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

function parseData(setNum){
	var data = document.getElementById("data"+setNum).value.trim().split(/[\s,;\t\n]+/)
	for(var i=0; i<data.length; i++) { data[i] = +data[i]; }
	data.sort(function(a, b){return a-b})
	return data
}

function parseSurvivalData(setNum){
	var data = document.getElementById("data"+setNum).value.trim().split(/[\s,;\t\n]+/)
	var censored = []
	for(var i=0; i<data.length; i++) { 
		if(data[i].includes("+")){
			data[i] = +(data[i].substring(0,data[i].indexOf("+")))
			censored[i]=true;
		} else {
			data[i] = +data[i];
			censored[i] = false;
		}			
	}
	var tempTime = 0
	var tempCensored = false
	for(var i=0; i<data.length-1; i++){
		for(var k=i+1; k<data.length; k++){
			if(data[k]<data[i]){
				tempTime = data[k]
				tempCensored = censored[k]
				data[k]=data[i]
				data[i]=tempTime
				censored[k]=censored[i]
				censored[i]=tempCensored
			}
		}
	}
	
	
	return [data,censored];
}

function fixBounds(id1, id2, pushUp=true){
	if(pushUp){
		document.getElementById(id2).value = Math.max(document.getElementById(id1).value, document.getElementById(id2).value)
	} else {
		document.getElementById(id1).value = Math.min(document.getElementById(id1).value, document.getElementById(id2).value)
	}
}

function updateNames(nSets){
	for(var set=1; set<=nSets; set++){
		var setName = document.getElementById("name"+set).value;
		var elements = document.getElementsByClassName("Name"+set);
		for(var i=0; i<elements.length; i++) {
			elements[i].innerHTML=setName;
		}
	}
}

function cleanDataInput(nSets){
	for(var set=1; set<=nSets; set++){
		var data = document.getElementById("data"+set).value.trim().split(/[\s,;\t\n]+/)
		var n=data.length
		var myArray = [];
		for (var i = 0; i<n; i++){
			var index = data[i].indexOf("x")
			if(index>=0){
				var nTimes = parseInt(data[i].substring(0,index))
				var datum = parseFloat(data[i].substring(index+1))
				for(var j=0; j<nTimes; j++){
					myArray.push(datum)
				}
			} else if(data[i]!=''){
				myArray.push(isNumeric(Number(data[i]))?Number(data[i]):data[i])
			}
		}
		myArray.sort(function(a, b){return a-b})
		data = myArray
		n=data.length
		var dataInput = ""
		if (n>0) dataInput = data[0]
		for( var i=1; i<n; i++){
			dataInput += " "+ data[i] 
		}
		document.getElementById("data"+set).value=dataInput
		dataMessy[set-1] = false;
	}	
}


// ------------ URL FUNCTIONS ---------------------- //

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function getQueryVariable(variable){
//	console.log("looking for "+variable);
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
		   if(pair[0] == variable){
//			   console.log(pair[1])
			   return pair[1];
			}
	}
	return(null);
}

function encode(unencoded) {
	return encodeURIComponent(unencoded).replace(/'/g,"%27").replace(/"/g,"%22").replace(/\+/g,'%2b').replace(/%09/g,'+').replace(/%20/g,'+').replace(/%0A/g,')');	
}

function decode(encoded) {
	//console.log(encoded)
	return decodeURIComponent(encoded.replace(/\+/g, " ").replace(/\)/g, "\n"));
}

function parseDataFromURL(nSets){
	for(var i=1; i<=nSets; i++){
		if(getQueryVariable("name"+i)!=null){
			nSamples = i;
			nCovars=i-1;
			if(exists('name'+i)) document.getElementById("name"+i).value=decode(getQueryVariable("name"+i));
		}
		if(getQueryVariable("data"+i)!=null)
			document.getElementById("data"+i).value=decode(getQueryVariable("data"+i));					
	}
	if(getQueryVariable("varUnits1")!=null)
		document.getElementById("varUnits1").value = decode(getQueryVariable("varUnits1"));
	if(getQueryVariable("units1")!=null)
		document.getElementById("units1").value = decode(getQueryVariable("units1"));
	if(getQueryVariable("units2")!=null)
		document.getElementById("units2").value = decode(getQueryVariable("units2"));
	if(getQueryVariable("varName1")!=null)
		document.getElementById("varName1").value = decode(getQueryVariable("varName1"));
	if(getQueryVariable("timeUnits")!=null)
		document.getElementById("timeUnits").value = decode(getQueryVariable("timeUnits"));
	if(getQueryVariable("t1")!=null)
		document.getElementById("t1").value = decode(getQueryVariable("t1"));
	if(getQueryVariable("tstep")!=null)
		document.getElementById("tstep").value = decode(getQueryVariable("tstep"));
}

function parseDataFromURLQual2V(){
	var sizeVars = ["rowVarName","colVarName","nRows","nCols"]
	if(getQueryVariable(sizeVars[0])!=null){
		for(var i=0; i<4; i++)
			document.getElementById(sizeVars[i]).value = decode(getQueryVariable(sizeVars[i]));
		refreshInputs();
		refresh();
		var nRows = parseInt(document.getElementById('nRows').value)
		var nCols = parseInt(document.getElementById('nCols').value)
		for(var i=0; i<=nRows; i++){
			for(var j=0; j<=nCols; j++){
				var elmt="";
				if(i==0 || j==0){
					if(j>0) elmt = "colHead"+j
					if(i>0) elmt = "rowHead"+i
				} else {
					elmt = "r"+i+"c"+j
				}
				if(i>0 || j>0){
					document.getElementById(elmt).value = decode(getQueryVariable(elmt));
				}
			}
		}
	}
}

function compressData(dataString, times="x"){
	var nLevels = 0
	var levels=[]
	var counts=[]
	var returnString = ""
	//encode all + signs
	dataString.replace(/\+/g,'%2b')
	var data = dataString.trim().split(/[\s,;\t\n]+/)
	for(var i=0; i<data.length; i++){
		found=false;
		for(var j=0; j<nLevels; j++){
			if(levels[j]==data[i]){
				counts[j]++;
				found=true;
				break;
			}
		}
		if(!found){
			levels[nLevels]=data[i]
			counts[nLevels]=1
			nLevels++
		}
	}
	for(var j=0; j<levels.length; j++){
		if(j>0) returnString+=" "
		returnString+= ""+counts[j]+times+levels[j]
	}
	return returnString;
}
			
function makeURL(n=nSamples, compress=true){
	var myURL = window.location.href.split('?')[0];
	myURL = myURL.split('#')[0]
	for(var i=1; i<=n; i++){
		if(exists("name"+i)) myURL+=(i>1?"&":"?")+"name"+i+"="+encode(document.getElementById("name"+i).value)
		if(exists("data"+i)){
			data=document.getElementById("data"+i).value
			if(compress){
				if(qualitative) {
					data = compressData(data,"*")
				} else {
					data = compressData(data,"x")
				}
			}
			myURL+="&data"+i+"="+encode(data)	
			if(exists("ChooseResponse")) myURL+="&response="+document.getElementById('ChooseResponse').value
		}
	}
	if(exists("varName1")) myURL +="&varName1="+encode(document.getElementById("varName1").value)
	if(exists("varUnits1")) myURL +="&varUnits1="+encode(document.getElementById("varUnits1").value)
	if(exists("units1")) myURL +="&units1="+encode(document.getElementById("units1").value)
	if(exists("units2")) myURL +="&units2="+encode(document.getElementById("units2").value)
	if(exists("timeUnits")) myURL +="&timeUnits="+encode(document.getElementById("timeUnits").value)
	if(exists("t1")) myURL +="&t1="+encode(document.getElementById("t1").value)
	if(exists("tstep")) myURL +="&tstep="+encode(document.getElementById("tstep").value)
		
		
//	console.log(myURL)
	getTinyURL(myURL)
}

function getTinyURL(myURL){
	document.getElementById("dataLink").innerHTML="<a href='"+myURL+"' class='tinyURL'>Long Link</a> | <span id='tinylink' ><span class='tinyURL'>tinyurl.com/...</span></span>"
	
	var url = "https://api.tinyurl.com/create";
	
	var xhr = new XMLHttpRequest();
	xhr.open("POST", url);
	
	xhr.setRequestHeader("accept", "application/json");
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("Authorization", "Bearer 9U7U0RadIXKz6GtCeppldU2kJZT968PpoJwyZgb093CFuvmSxJc6dTvxTlXQ");

	xhr.onreadystatechange = function () {
	   if (xhr.readyState === 4) {
		  console.log(xhr.status);
	//      console.log(xhr.responseText);
	//	  console.log(JSON.parse(xhr.responseText)["data"]["tiny_url"]);
		var tinyURL = JSON.parse(xhr.responseText)["data"]["tiny_url"]
		document.getElementById("tinylink").innerHTML = "<a href='"+tinyURL+"' class='tinyURL'>"+tinyURL.substring(7)+"</a>"	
	   }};

	var data = '{"url":"'+myURL+'","domain":"tiny.one"}';
	console.log(data)
	xhr.send(data);	
	
}

function makeURLQual2V(){
	var myURL = window.location.href.split('?')[0];
	var nRows = parseInt(document.getElementById('nRows').value)
	var nCols = parseInt(document.getElementById('nCols').value)
	myURL+="?";
	myURL+="rowVarName="+encode(document.getElementById('rowVarName').value);
	myURL+="&colVarName="+encode(document.getElementById('colVarName').value);
	myURL+="&nRows="+encode(document.getElementById('nRows').value);
	myURL+="&nCols="+encode(document.getElementById('nCols').value);
	for(var i=0; i<=nRows; i++){
		for(var j=0; j<=nCols; j++){
			var elmt="";
			if(i==0 || j==0){
				if(j>0) elmt = "colHead"+j
				if(i>0) elmt = "rowHead"+i
			} else {
				elmt = "r"+i+"c"+j
			}
			if(i>0 || j>0){
				myURL+= "&"+elmt+"="+encode(document.getElementById(elmt).value)
			}
		}
	}
/*	var tinyURLlong="http://tinyurl.com/api-create.php?url=" + encodeURIComponent(myURL)
	document.getElementById("dataLink").innerHTML="<a href='"+myURL+"' class='tinyURL'>Long Link</a> "
	document.getElementById("frmFile").src="tinyURL.php?url=" + encodeURIComponent(myURL);
	document.getElementById("frmFile").onload = function(){
		var tinyURL = document.getElementById("frmFile").contentWindow.document.body.innerHTML;
		document.getElementById("dataLink").innerHTML += "<a href='"+tinyURL+"' class='tinyURL'>"+tinyURL.substring(7)+"</a>"
	}*/
	getTinyURL(myURL)

}


// ------------ HTML ELEMENT FUNCTIONS ------------ //

function exists(elementID){
	var element =  document.getElementById(elementID);
	return (typeof(element) != 'undefined' && element != null)
}

function toggleCheck(boxName){
	document.getElementById("chk_"+boxName).checked= !document.getElementById("chk_"+boxName).checked;
	showHide();
}

function showHide(){
	for (var i = 0; i<regions.length; i++){
		if (document.getElementById("chk_"+regions[i]).checked==true) 
		{	document.getElementById(regions[i]).style.display="block"; }
		else
		{	document.getElementById(regions[i]).style.display="none";}
	}
}

function isOpen(checkName){
	return(document.getElementById(checkName).checked)
}

function toggleCanvas(obj){
	if(obj.className=='canvasdivTiny')
		obj.className='canvasdivBig';
	else	
		obj.className='canvasdivTiny';
}

function showHideProbs(showEquals=false, showChecked=false){
	if(showEquals) document.getElementById("prob_equal").style.display="none";
	document.getElementById("prob_above").style.display="none";
	document.getElementById("prob_between").style.display="none";
	document.getElementById("prob_below").style.display="none";
	document.getElementById("prob_tails").style.display="none";
	document.getElementById("prob_"+document.getElementById("probType").value).style.display="inline";
}

function generateSampleStatsTable(nSamples, columns, differences=false, dataInColumns=false){
	var tableContent = ""
	var labels=["Statistic",
				"Measures of Center",
				"Mean<br>(x&#772;) = ",
				"Median<br>(x͂) = ",
				"Mode  = ",
				"Midrange  = ",
				"Measures of Spread",
				"Range  = ",
				"Inter-Quartile<br>Range<br>(IQR)  = ",
				"Sample<br>Variance<br>(s&sup2;) = ",
				"Sample<br>Standard<br>Deviation<br>(s) = ",
				"Standard<br>Error<br>of the<br>Mean<br>(s<sub>x&#772;</sub>) = ",
				"Pop.<br>Standard<br>Deviation<br>(&sigma;) = ",
				"Other Statistics",
				"Sample<br>Size<br>(n) = ",
				"Minimum = ",
				"First<br>Quartile<br>(Q1) = ",
				"Third<br>Quartile<br>(Q3) = ",
				"Maximum = ",
				"Percentile (<a href='https://en.wikipedia.org/wiki/Quantile#Estimating_quantiles_from_a_sample'>R-8</a>)<br><input name='perc' type='number' class='smallNumber' id='perc' value='.05' step='.01' min='0.0001' max='0.9999' onchange='percentile("+nSamples+(dataInColumns?",true":"")+(differences?");getDiffPercentile(":"")+")' /> = ",
				"Skew = ",
				"Kurtosis  = "]
	var ids=[	"statsName",
				"",
				"stat_xbar",
				"stat_median",
				"stat_mode",
				"stat_midrange",
				"",
				"stat_range",
				"stat_IQR",
				"stat_var",
				"stat_s",
				"stat_sx",
				"stat_sigma",
				"",
				"stat_n",
				"stat_min",
				"stat_Q1",
				"stat_Q3",
				"stat_max",
				"percentile",
				"stat_skew",
				"stat_kurtosis"
				]
	if(columns){
		tableContent+="							<div class='zui-wrapper'>"
		tableContent+="								<div class='zui-scroller'>"
		tableContent+="									<table class='statsTable'>"// class='zui-table'>"
		tableContent+="										<thead>"
		tableContent+="											<tr>"
		tableContent+="												<th class='headcol sticky-col first-col'></th>"
		var grpCount=0
		for(var j=1; j<labels.length; j++){
			labels[j]=labels[j].replace(" = ","");
//			labels[j]=labels[j].replace(/\s/g,"<br>");
			
			if(ids[j]!="") {tableContent+="																<th class='long "+((j+grpCount)%2==0?" shaded":"")+"'>"+labels[j]+"</th>"
			} else {grpCount++}
		}
		tableContent+="											</tr>"
		tableContent+="										</thead>"
		tableContent+="										<tbody>"
		for(var i=1; i<=nSamples; i++){
			tableContent+="<tr id='statRow"+i+"'><td class='headcol  sticky-col first-col Name"+i+"' id='statsName"+i+"'>"+document.getElementById("name"+i).value+"</td>"
			grpCount=0
			for(var j=1; j<labels.length; j++){
				if(ids[j]!=""){
					tableContent+="	<td id=\""+ids[j]+i+"\" "+((j+grpCount)%2==0?"class='shaded'":"")+">&nbsp;</td>"
				} else {grpCount++}
			}
			tableContent+="</tr>"
		}
		tableContent+="										</tbody>"
		tableContent+="									</table>"
		tableContent+="								</div>"
		tableContent+="							</div>"
	} else {
		tableContent+="						<table width=\"100%\" class='statsTable'>"
		var k=0
		for(var j=0; j<labels.length; j++){
			var isHeader = (ids[j]=="")
			labels[j]=labels[j].replace(/<br>/g," ");
			tableContent+="<tr"+(j==0?" class='tableHeader'":"")+(!isHeader && k%2==1?" class='shaded'":"")+(j>0 && isHeader?" class='sectionHeader'":"")+">"
			tableContent+="<td class='first-col sticky-col'>"+(isHeader?"<strong>":"")+labels[j]+(isHeader?"</strong>":"")+"</td>"
			if(ids[j]=="") tableContent+="<td colspan=\""+(nSamples+(differences?1:0))+"\"></td>"
			for(var i=1; i<=nSamples+(differences?1:0) && ids[j]!=""; i++)
				tableContent+="<td "+(j==0?"class=\"remainingWidth Name"+i+"\" ":"")+"id=\""+ids[j]+i+"\"></td>"
			tableContent+="<td></td></tr>"
			if(!isHeader)k++
		}
		tableContent+="						</table>"
	}
	document.getElementById("output").innerHTML=tableContent;
	if(differences) document.getElementById('statsName3').innerHTML="Difference"
}

function linkMenu(){
	var menuString =	"<div class='relative'><span class=\"menuSection\" "+ 
"		onclick=\"document.getElementById('menu1').style.display=(document.getElementById('menu1').style.display=='block'?'none':'block');\"  "+ 
"		onmouseleave=\"document.getElementById('menu1').style.display='none';\"> "+ 
"<span class='fauxButton'>Analysis</span>"+ 
"<div id=\"menu1\" class=\"menuOptions\"> "+ 
"			<a href='data.html'>Datasets</a> "+ 
"			<hr>" +
"			<a href='descriptiveStats.html'>Quantitative 1-Sample</a> "+ 
"			<a href='descriptiveStats2Sample.html'>Quantitative 2-Sample (Independent)</a> "+ 
"			<a href='descriptiveStatsNSample.html'>Quantitative N-Sample (3+ Independent)</a> "+ 
"			<a href='dependentSamples.html'>2 Dependent (Paired) Samples</a> "+ 
"			<a href='multipleRegression.html'>Multiple Regression</a> "+ 
"			<a href='timeSeries.html'>Time Series</a> "+ 
"			<a href='survival.html'>Survival Analysis</a> "+ 
"			<a href='spatial.html'>Spatial Statistics</a> "+ 
"			<hr>" +
"			<a href='descriptiveStatsQualitative.html'>Qualitative 1 Variable</a> "+ 
"			<a href='contingencyTable.html'>Qualitative 2 Variable</a> "+ 
"			<a href='goodnessOfFit.html'>Goodness of Fit Test</a> "+ 
"			<hr>" +
"			<a href='bayes.html'>Bayes Theorem</a> "+ 
"			<a href='venn.html'>Venn Diagram</a> "+ 
"			<a href='sampleSize.html'>Sample Size Calculator</a> "+ 
"</div>"+ 
"</span> "+ 
" <span class=\"menuSectionNoLink hideOnMobile\" >Distributions:</span>"+
"	<div class=\"menuSection\" "+  
"		onclick=\"document.getElementById('menu2').style.display=(document.getElementById('menu2').style.display=='block'?'none':'block');\"  "+ 

"		onmouseleave=\"document.getElementById('menu2').style.display='none';\"> "+ 
"		<span class='fauxButton'>Discrete</span>"+ 
"<div id=\"menu2\" class=\"menuOptions\"> "+ 
"			<a href='distributionCustom.html'>Custom Discrete</a> "+ 
"			<a href='distributionDiscrete.html?f=uniform'>Uniform</a>	 "+ 
"			<a href='distributionDiscrete.html?f=binomial'>Binomial</a> "+ 
"			<a href='distributionDiscrete.html?f=geometric'>Geometric</a>	 "+ 
"			<a href='distributionDiscrete.html?f=Poisson'>Poisson</a>	 "+ 
"			<a href='distributionDiscrete.html?f=hypergeometric'>Hypergeometric</a>	 "+ 
"			<a href='distributionDiscrete.html?f=negativebinomial'>Negative binomial</a>	 "+ 
"		</div>"+ 
"</div>"+ 
"<div class=\"menuSection\"  "+ 
"		onclick=\"document.getElementById('menu3').style.display=(document.getElementById('menu3').style.display=='block'?'none':'block');\"  "+ 
"		onmouseleave=\"document.getElementById('menu3').style.display='none';\">"+ 
"<span class='fauxButton'>Continuous</span>"+ 
"<div id=\"menu3\" class=\"menuOptions\"> "+ 
"			<a href='distributionCustomContinuous.html'>Custom Continuous</a>	 "+ 
"			<a href='distributionContinuous.html?f=uniform'>Uniform</a> "+ 
"			<a href='distributionContinuous.html?f=Gaussian'>Gaussian (normal)</a> "+ 
"			<a href='distributionContinuous.html?f=T'>Student's t</a>	 "+ 
"			<a href='distributionContinuous.html?f=Gamma'>Gamma</a>	 "+ 
"			<a href='distributionContinuous.html?f=exponential'>Exponetial</a> "+ 
"			<a href='distributionContinuous.html?f=chiSq'>Chi Squared</a>	 "+ 
"			<a href='distributionContinuous.html?f=F'>F</a>	 "+ 
"			<a href='distributionContinuous.html?f=Beta'>Beta</a>	 "+ 
"			<a href='distributionContinuous.html?f=log-normal'>Log-Normal</a> "+ 
"			<a href='distributionContinuous.html?f=Weibull'>Weibull</a> "+ 
"			<a href='distributionContinuous.html?f=Pareto'>Pareto</a> "+ 
"			<hr>" +
"			<a href='empiricalRule.html'>Empirical Rule Calculator</a> "+ 
"			<a href='pixelNormal.html'>Pixel Normal Calculator</a> "+ 
"		</div>"+ 
"</div>" +
"<div class=\"menuSection\"  "+ 
"		onclick=\"document.getElementById('menu4').style.display=(document.getElementById('menu4').style.display=='block'?'none':'block');\"  "+ 
"				onmouseleave=\"document.getElementById('menu4').style.display='none';\">"+ 
"<span class='fauxButton'>Sampling</span>"+ 
"<div id=\"menu4\" class=\"menuOptions\"> "+ 
"			<a href='samplingDistribution.html'>Sampling Distribution (Mean)</a> "+ 
"			<a href='samplingDistributionSum.html'>Sampling Distribution (Sum)</a> "+ 
"			<a href='samplingDistributionProportion.html'>Sampling Distribution (Proportion)</a>"+ 
"			<a href='populationGenerator.html'>Population Sampling Simulator</a>"+ 
"		</div>"+ 
"</div>"+
"<div class=\"menuSection\"  "+ 
"		  "+ 
"		onmouseleave=\"document.getElementById('menu5').style.display='none';\">"+ 
"<span class='fauxButton' onclick=\"document.getElementById('menu5').style.display=(document.getElementById('menu5').style.display=='block'?'none':'block');\"><i class=\"fa fa-sliders\" aria-hidden=\"true\"></i></span>"+ 
"		<div id=\"menu5\" class=\"menuOptions\"> "+ 
"			<span>Precision: <select id=\"precision\" onchange=\"refresh();\">"

for (var i=0; i<=10; i++){
	menuString +="			  <option value=\""+i+"\""+(i==precision?" selected":"")+">"+i+"</option>"
}
menuString +="			</select></span>"+
"			<span><input type=\"checkbox\" id=\"colorful\" checked=\"checked\" onClick=\"refresh();document.getElementById('menu5').style.display='block';\"/> <label for=\"colorful\">Colorful</label></span>"+
"		<span>Color: <select id=\"colorChoice\" onchange=\"updateColorChoice();\" style='background-color:"+(colorChoice==-1?"white":colorChoices[colorChoice])+"'>" 
for(var i=-1; i<colorChoices.length; i++){
//	console.log(i)
	menuString +="<option value="+ i +" "+(i == colorChoice?" selected":"")+" style='background-color:"+(i==-1?"white":colorChoices[i])+"'>"+(i==-1?"random":colorChoices[i])+"</option>"	
}

menuString +="		</div>"+ 
"	</div>"+
"</div>"
	document.getElementById("menu").innerHTML = menuString;
}

function updateColorChoice(){
	colorChoice = document.getElementById('colorChoice').value
	if (typeof(Storage) !== "undefined") {
		localStorage.setItem("COLORCHOICE",colorChoice);
	}	
	
	document.getElementById('colorChoice').style.backgroundColor=(colorChoice==-1?"white":colorChoices[colorChoice])
	refreshColors(colorChoice)
}

function selectColor(elmt, cIndex){
	var swatchDiv = document.createElement("div")
	swatchDiv.className="swatchPalette"
	swatchDiv.id="swatchPalette"
	swatchDiv.addEventListener('mouseleave', function(event){
		this.remove()
	});
	var contentHTML=""
	for(var i=0; i<colors.length; i++){
		contentHTML+="<div class='swatch' style='background-color:"+colors[i]+"' onClick='confirmColor("+cIndex+","+i+")''></div>"
		if(i%8==6) contentHTML+="<br>"
	}
	swatchDiv.innerHTML=contentHTML
	elmt.appendChild(swatchDiv)
}

function confirmColor(index, color){
	customColors[index]=colors[color]
	labelColors[index]=color
	refreshAfterConfirmColor()
}

function refreshColors(colorChoice){
	var newColorRGBA = colorToRGBA(colorChoice==-1?"white":colorChoices[colorChoice])
//	console.log(newColorRGBA)
	var white=[255,255,255,255]
	var levels=[0,.5,.75]

	var color1 = rgbToHex(newColorRGBA[0],newColorRGBA[1],newColorRGBA[2])
	var color2 = rgbToHex(Math.round(.5*newColorRGBA[0]+.5*255),Math.round(.5*newColorRGBA[1]+255*.5),Math.round(.5*newColorRGBA[2]+255*.5))
	var color3 = rgbToHex(.25*newColorRGBA[0]+.75*255,.25*newColorRGBA[1]+255*.75,.25*newColorRGBA[2]+.75*255)
		
	document.getElementById("title").style.backgroundColor = color1
	document.getElementById("container").style.backgroundColor = color2
	document.getElementById("menu").style.backgroundColor = color2
		
//	console.log(color1)
//	console.log(color2)
	var whiteness=.5
//	console.log(color3)
	colorHex = color2
	colorHexLite = colorString( (1-whiteness)*hexToRgb(color1).r/255 + whiteness, (1-whiteness)*hexToRgb(color1).g/255 + whiteness, (1-whiteness)*hexToRgb(color1).b/255 + whiteness)
	whiteness=0
	colorHexDark = colorString( (1-whiteness)*hexToRgb(color1).r/255 + whiteness, (1-whiteness)*hexToRgb(color1).g/255 + whiteness, (1-whiteness)*hexToRgb(color1).b/255 + whiteness)
	refresh();
}

function fixInputSizes(){
	var classNames = ["tinyNumber","smallNumber","mediumNumber","bigNumber"]
	var sizes = ["4em","7em","10em","15em"]
	for(var i=0; i<classNames.length; i++){
		var elmts = document.getElementsByClassName(classNames[i])
//		console.log(elmts.length)
		for(var j=0; j<elmts.length; j++){
			elmts[j].style.width=sizes[i]
			elmts[j].style.maxWidth=sizes[i]
		}
	}
	classNames = ["smallTextArea","mediumTextArea"]
	sizes = ["6em","10em"]
	for(var i=0; i<classNames.length; i++){
		var elmts = document.getElementsByClassName(classNames[i])
		for(var j=0; j<elmts.length; j++){
			elmts[j].style.height=sizes[i]
		}
	}
}

// ------------ STATISTICAL FUNCTIONS -------- //

function calculateStats(set, data){
	var n = data.length
	var fiveNumSummary = fiveNumSum(data)
	if(exists("stat_n"+set)){
		document.getElementById("stat_n"+set).innerHTML =  n  
		document.getElementById("stat_xbar"+set).innerHTML = +(jStat.mean(data)).toFixed(precision)  
		document.getElementById("stat_median"+set).innerHTML = +(fiveNumSummary[2]).toFixed(precision) 
		dataMode = jStat.mode(data)
		//alert(dataMode)
		if(dataMode.length == n) {document.getElementById("stat_mode"+set).innerHTML = "none"} 
		else if (dataMode.length>1){ document.getElementById("stat_mode"+set).innerHTML = dataMode.join(", ")}
		else {document.getElementById("stat_mode"+set).innerHTML = dataMode}
		document.getElementById("stat_midrange"+set).innerHTML = +((jStat.max(data) + jStat.min(data))/2).toFixed(precision) 
		document.getElementById("stat_min"+set).innerHTML = +(fiveNumSummary[0]).toFixed(precision) 
		document.getElementById("stat_Q1"+set).innerHTML = +fiveNumSummary[1].toFixed(precision) 
		document.getElementById("stat_Q3"+set).innerHTML = +fiveNumSummary[3].toFixed(precision) 
		document.getElementById("stat_max"+set).innerHTML = +(fiveNumSummary[4]).toFixed(precision)  
		document.getElementById("stat_range"+set).innerHTML = +jStat.range(data).toFixed(precision)  
		document.getElementById("stat_IQR"+set).innerHTML = +(fiveNumSummary[3]-fiveNumSummary[1]).toFixed(precision) 
		document.getElementById("stat_var"+set).innerHTML = +(jStat.variance(data,true)).toFixed(precision)  
		document.getElementById("stat_s"+set).innerHTML = +(jStat.stdev(data,true)).toFixed(precision) 	
//		console.log("stat_sx"+set + " exists?"+exists("stat_sx"+set))
		if(exists("stat_sx"+set)) document.getElementById("stat_sx"+set).innerHTML = +(jStat.stdev(data,true)/Math.sqrt(n)).toFixed(precision) 
		if(exists("stat_sigma"+set)) document.getElementById("stat_sigma"+set).innerHTML = +(jStat.stdev(data)).toFixed(precision) 	
		document.getElementById("stat_skew"+set).innerHTML = +(jStat.skewness(data)).toFixed(precision)  
		document.getElementById("stat_kurtosis"+set).innerHTML = +(jStat.kurtosis(data)+3).toFixed(precision) 		
	}
}

function sampleStats(nSets, useTransformed=false) {
	for(var set=1; set<=nSets; set++){
		var data = (useTransformed?transformedData:parseData(set))
		calculateStats(set, data)
	}
}

function arrayProportion(x, q, tails){
	var l=0, g=0, t=0
	for(var i=0; i<x.length; i++){
		if(q >= x[i]) l++
		if(q <= x[i]) g++
		if(Math.abs(q) <= x[i]) t+=2
	}
	g = g/x.length
	l = l/x.length
	t = t/x.length
	if(tails=="lower") {
		return l
	} else if (tails == "greater"){
		return g
	} else {
		return Math.min(1,t)
	}
}

function estimatePercentile(x, p=.95){
//	console.log("Getting "+p)
	x = sortArray(x)
	var n = x.length
	if(p < (2/3)/(n+1/3)){
		return(x[0])
	} else if (p >= (n-1/3)/(n+1/3)){
		return(data[n-1])
	} else {
		var h = (n+1/3)*p + 1/3 -1
		var hFloor = Math.floor(h)
//		console.log(h)
		if(hFloor==n-1) {
			return(x[n-1])
		} else {
//			console.log((x[hFloor] + (h-hFloor)*(x[hFloor+1]-x[hFloor])))
			return (x[hFloor] + (h-hFloor)*(x[hFloor+1]-x[hFloor]))
		}
	}
}


function getPercentile(data, set, p=0){
	var perc = (p>0?p:+(exists('perc')?document.getElementById('perc').value:.05))
	data = sortArray(data)
	var n=data.length
	var percentile = estimatePercentile(data, perc)
	document.getElementById('percentile'+set).innerHTML= +percentile.toFixed(precision)
}

function percentile(nSets, columns=false){
	for(var set=1;set<=nSets;set++){
		if(exists('percentile'+set)){
			var data = (columns?getColumnNumeric(set):parseData(set))
			getPercentile(data, set)
		}
	}
}

function uniqueValues(arr) {
    var a = [];
    for (var i=0, l=arr.length; i<l; i++)
        if (a.indexOf(arr[i]) === -1 && arr[i] !== '')
            a.push(arr[i]);
    return a;
}

function sortArray(arr){
	return (arr.sort(function(a, b){return a-b}))
}


function leveneTest(nSets, type){
	var output = ""
	var allData = []
	for(var dataset=1; dataset<=nSets; dataset++){
		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		allData = allData.concat(data)	
	}
	var allN = allData.length
	for(var i=0; i<allN; i++) { allData[i] = +allData[i]; }
	allData.sort(function(a, b){return a-b})
	
	var SS = 0
	var SSnum = 0
	var Z = []
	var N = []
	var Zsum = 0
	for(var dataset = 1; dataset <= nSets; dataset++){
		var data = document.getElementById("data"+dataset).value.trim().split(/[\s,;\t\n]+/)
		var n=data.length
		for(var i=0; i<n; i++) { data[i] = +data[i]; }
		var center = jStat.mean(data)
		if (type=="median") center = jStat.median(data)
		for(var i=0; i<n; i++) { data[i] = Math.abs(data[i]-center); }
		Z[dataset]=jStat.mean(data)
		N[dataset]=n
		Zsum += n * Z[dataset]
		SS += (n-1)*jStat.variance(data,true)
	}
	var Zmean = Zsum / allN
	for(var dataset = 1; dataset <= nSets; dataset++){
		SSnum += N[dataset] * Math.pow(Z[dataset] - Zmean,2)
	}
	var W = (allN - nSets) / (nSets - 1) * SSnum / SS
	output += "W = "+W.toFixed(precision)
	output += " (<i>p</i>-value="+ (1-jStat.centralF.cdf(W,nSets-1,allN-nSets)).toFixed(precision) + ")<br>\n"
	return output
}

function myTrim(x){
//	return x;
//	return x.replace(/ /g,'');
	return x.replace(/^ +| +$/gm,' ')
}

function getColumn(set, splitBySpace=true, elID="data1"){
	var data = myTrim(document.getElementById(elID).value).split(/[\n]+/)
	var n=data.length
	var myArray = [];
	for (var i = 0; i<n; i++){
		data[i]=data[i].replaceAll(';','\t').replaceAll(',','\t')
		if(splitBySpace)data[i]=data[i].replaceAll(' ','\t')
		var vars = data[i].split('\t')
//		alert("var is '"+vars[set-1]+"'")
		if(vars[set-1]!=null && vars[set-1]!="") myArray.push(vars[set-1])
	}
	return myArray
}

function fillColumns(){
//				alert("fill columns")
	data = new Array(nSamples)
	var nRows = 0
	for(var j=1; j<=nSamples; j++){
		document.getElementById("colName"+j).value = document.getElementById("name"+j).value;
		data[j-1]=document.getElementById("data"+j).value.trim().split(/[\s,;\t\n]+/)
		if(data[j-1].length==1 && data[j-1][0]=="") data[j-1]=[];
		nRows = Math.max(nRows,data[j-1].length)
	}

	var colData = "";
	for(var i=0; i<nRows; i++){
		for(var j=1; j<=nSamples; j++){
			if(j>1) colData +="\t"
			colData += (i>=data[j-1].length?"":data[j-1][i])
		}
		colData +="\n"
	}
	document.getElementById("dataColumns").value=colData;			
}

function fillDataArea(){
//				alert("fill data area")
//				for(var j=1; j<=nSamples; j++){
//				}				
//				document.getElementById("name2").value = document.getElementById("colName2").value;
	for(var set=1; set<=nSamples; set++){
		document.getElementById("name"+set).value = document.getElementById("colName"+set).value;
		var data = getColumn(set,false,"dataColumns")
//			alert(data)
		var dataString = ""
		for(var i=0; i<data.length; i++){
			if(i>0) dataString += " "
			dataString += data[i]
		}
//					alert(dataString)
//					alert('data'+set)
//					alert(document.getElementById('data'+set).value)
//					document.getElementById("data"+set).value = ""
		document.getElementById("data"+set).value = dataString;
	}		
}

var inputDataMatrix=[]

function cleanDataColumns(elementID, cleanSpaces=true){
	var data = myTrim(document.getElementById(elementID).value).split(/[\n]+/)
//	console.log(data)
	var n=data.length
	var myArray = [];
	inputDataMatrix=[]
	for (var i = 0; i<n; i++){
//		console.log(myTrim(data[i]))
//		console.log(data[i])
//		console.log(data[i].split('\t'))
		if(cleanSpaces) data[i]=data[i].replaceAll(' ','\t')
		data[i]=data[i].replaceAll(';','\t').replaceAll(',','\t')
//		var vars = data[i].split(/[\s,;\t]+/)
		var vars = data[i].split('\t')
		//console.log(vars)
		if(data[i]!=['']){ 
			myArray.push(vars)
			inputDataMatrix.push(vars)
		}
	}
	data = myArray
	n=data.length
	var dataInput = ""
	for( var i=0; i<n; i++){
		for(var k=0; k<data[i].length; k++){
			if (k>0) dataInput += "\t"
			dataInput += data[i][k] 
		}
		if(i<n-1) dataInput += "\n"
	}
	document.getElementById(elementID).value=dataInput
}


function getColumnNumeric(set, splitBySpace=true){
	var dataArray=getColumn(set,splitBySpace)
	for(var i=0; i<dataArray.length; i++)
		dataArray[i]=+dataArray[i];
	return dataArray
}

var copyBlock = false

function copyTo(toID){
	copyVal(event.target.id, toID)
}

function copyVal(fromID, toID){
	if(!copyBlock){
//		console.log(fromID +" to "+toID)
		copyBlock=true;
		document.getElementById(toID).value = document.getElementById(fromID).value
		copyBlock=false;
	}
}
	
function normality(nDataSets, inCol, skipVars = 0, alsoResids=false, gof=0) {
	document.getElementById("normality").innerHTML=""
	var outputString="<table class='normalityTable'>"
	var first = true
	for(var dataset = 1; dataset <= nDataSets+(alsoResids?1:0); dataset++){
//		console.log("residuals? "+alsoResids)
		if(!first) {outputString +="<tr class='divider'><td colspan=2></td></tr>\n"}
		var data = null
		if(alsoResids && dataset == nDataSets+1){
			data = Resid
		} else if (inCol==true) {
			data = getColumn(dataset)
		} else {
			data = parseData(dataset)
		}
		if(skipVars == 0 || skipVars!=0 && !skipVars[dataset]){
			first=false;
			var n=data.length
			if(n>4){
				var xBar = jStat.mean(data)
				var s = jStat.stdev(data,true)
				outputString+="<tr><td colspan=2>Data Set: <strong>"+((alsoResids && dataset == nDataSets+1)?"Residuals":document.getElementById("name"+dataset).value) + "</strong></td></tr>\n";
				if(n>4 && n<5000){
					var W = ShapiroWilkW(data)
					outputString += "<tr><td>Shapiro-Wilk Test:</td><td>W="+W[0].toFixed(precision)+", (<i>p</i>-value = "+W[1].toFixed(precision)+")</td></tr>\n"
				}
				var K = ksTest(data, "normal")
		//		console.log(K)
				outputString +="<tr><td>Kolmogorov-Smirnov Test:</td><td>D="+K[0].toFixed(precision)+", (<i>p</i>-value = "+K[1].toFixed(precision)+")</td></tr>\n"
				
//				console.log(gof)
//				console.log(n)
				if(gof > -1 && n>=20){
//					console.log(jStat.range(data))
					var cellLength = jStat.range(data)/(1+3.322*Math.log(n))
					//console.log(cellLength)
					var nCells = jStat.range(data)/cellLength
					//console.log(Math.round(nCells))
					if(exists('GOFnBins'))gof=document.getElementById('GOFnBins').value
					if(gof!=0){
						gof=Math.round(gof)
						if(gof<4)gof=4
						gof=Math.min(gof,Math.floor(n/5))
					}
					var nBins = (gof==0?(Math.floor(Math.min(Math.sqrt(n),n/5))):gof)
					var freq=[]
					var chisq=0
//					console.log(nBins)
					for(var i=0; i<nBins; i++){
						freq[i]=0
						var q1=(i==0?-Infinity:jStat.normal.inv(i/(nBins),xBar,s))
						var q2=(i==nBins-1?Infinity:jStat.normal.inv((i+1)/nBins,xBar,s))
						for(var j=0;j<n; j++){
							if(data[j]>q1 && data[j]<=q2)freq[i]++
						}
						chisq += Math.pow(freq[i]-n/nBins,2)/(n/nBins)
//						console.log(freq[i] + " between "+q1 + " and " +q2)
					}
	//				console.log(chisq)
					var pval=1-jStat.chisquare.cdf(chisq,nBins-3)
//					console.log()
		//			console.log(freq)
					outputString +="<tr><td>&#967;<sup>2</sup> GOF Test ("+nBins+" bins):</td><td>&#967;<sup>2</sup>="+fixed(chisq)+", (<i>p</i>-value ="+fixed(pval)+", df="+(nBins-3)+")</td></tr>\n"
					
				}
				
				
			}
		}	
	}
	outputString+="</table>"
	document.getElementById("normality").innerHTML += outputString;					
		
}

function goodnessOfFitTest(){
	var n= Math.round(parseFloat(document.getElementById("n").value))
	var O=[]
	var E=[]
	var p=[]
	var N=0
	var Esum=0
	for(var i = 0; i <n; i++){
		O.push(parseInt(document.getElementById("o_"+i).value))
		N+=parseInt(document.getElementById("o_"+i).value)
		E.push(parseFloat(document.getElementById("e_"+i).value))
		Esum +=parseFloat(document.getElementById("e_"+i).value)
	}

	var chiSq = 0
	var nltFive=0
	for(var i = 0; i <n; i++){
		E[i]=E[i]/Esum*N
		chiSq += Math.pow(O[i] - E[i],2)/E[i]
		p[i]=E[i]/(Esum*N)
		nltFive+=E[i]<5?1:0
	}
	var df = n-1
//	alert(E)
	
	var outputString = "<strong>Results:</strong><br>\n"
	outputString +="H<sub>0</sub>: Data are consistent with the specified distribution<br>\n H<sub>1</sub>: Data <i>are not</i> consistent with the specified distribution<br>\n"
	outputString += "Observations = " + N +"<br>\n"
	outputString += "<table>\n<tr><th>Outcome</th><th>Observed Freq.</th><th>Expected Freq.</th></tr>"
	for(var i=0; i<n; i++){
		outputString+= "<tr><td>"+document.getElementById("x_"+i).value+"</td><td>"+O[i]+"</td><td>"+E[i].toFixed(precision)+"</td></tr>\n"
	}
	outputString+="</table>\n";
	
	outputString +="<hr>";
	outputString +="<b>Chi Squared Test</b><br>"
	if(nltFive>0) outputString+="<i>At least one expected cell &lt;5. Approximation may be bad.</i><br>"
	outputString += "&chi;<sup>2</sup> = "+chiSq.toFixed(precision)+"<br>\n";
	outputString += "d.f. = "+df+"<br>\n";
	outputString += "<i>p</i>-value = "+ (1-jStat.chisquare.cdf(chiSq,df)).toFixed(precision)+"<br>\n";
	
	var K = p.length
	var permutations=jStat.combination(N+K-1, K-1)
//	console.log(permutations)

	outputString +="<hr>"
	outputString +="<b>Exact Multinomial Test</b><br>"	
	
	if(permutations<1000000){
		var pObs = exactMultiProb(O,p,N)
//		console.log("p Obs:"+pObs)
//		console.log(p)

//		console.log("N="+N+" K="+p.length)
		//iterate over all multinomial possibilities
		var bars = []
		for(var i=0; i<K-1; i++) bars[i]=0
		bars[K-2]=-1
		
		var denom=0
		var moreRare=0
		var sumPs=0
		var empiricalP=0
		while(bars[0]<N){
			for(var j=K-2; j>=0;j--){
				if(bars[j]<N){
					var bump=bars[j]+1
					for(var i=j; i<K-1;i++) bars[i]=bump
					break;
				}
			}
			//console.log(bars)
			x=[]
			for(var i=0; i<p.length; i++){
				x[i]=(i==p.length-1?N:bars[i])-(i==0?0:bars[i-1])
			}
			var thisP=exactMultiProb(x,p,N)
//			if(denom<100)console.log(x + ": "+thisP )
			if (thisP <= pObs) empiricalP+=thisP		
			denom++
			sumPs += thisP
//			sumPs+=exactMultiProb(x,p,N)
		}
//		console.log(moreRare)
//		console.log(denom)
//		console.log(sumPs)
/*
		for(var k=0; k<10000; k++){
			x=[]
			for(var i=0; i<p.length; i++)x[i]=0
			for(var j=0; j<N; j++){
				var i=0
				for(var r=Math.random(); r-=p[i];i++){}
				x[i-1]++
			}
			
		}*/
//		var empiricalP = moreRare/denom
		outputString +="Number of permutations: "+denom+"<br>"
		outputString +="P<sub>Obs</sub>: "+fixed(pObs)+"<br>"
		outputString +="<i>p</i>-value: "+fixed(empiricalP/sumPs)+"<br>"
	} else {
		outputString +="<i>Number of permutations exceeds 1M.</i>"
	}
	document.getElementById("chiSqTest").innerHTML=outputString
}	

function exactMultiProb(x,p,N){
	var pObs = 1
	for(var i=0; i<x.length; i++){
		pObs *= Math.pow(p[i],x[i]) / jStat.factorial(x[i])
	}
	return (jStat.factorial(N) * pObs)
}


function ksTest(data, distribution){
	var n=data.length
	for(var i=0; i<n; i++) data[i]=parseFloat(data[i])
	var xBar = jStat.mean(data)
	var s = jStat.stdev(data,true)
	//console.log(xBar)
	var d=0;
	for(var i=0; i<data.length; i++){
		d=Math.max(d,Math.abs(i/n- jStat.normal.cdf(data[i],xBar,s)))	
		d=Math.max(d,Math.abs((i+1)/n - jStat.normal.cdf(data[i],xBar,s)))	
	//	console.log(data[i]+": |"+(i/n)+" - "+jStat.normal.cdf(data[i],xBar,s) +"|="+ Math.abs(i/n- jStat.normal.cdf(data[i],xBar,s)))
	}
	var p = kolmogorovCDF(Math.sqrt(n)*d)
	return [d,p]
}

function kolmogorovCDF(x){
	var p=1;
	for(var term=1; term<=100; term++){
		p+= 2*Math.pow(-1,term) * Math.exp(-2*Math.pow(term*x,2))
	}
	return 1-p;	
}

function median(arr){
  const mid = Math.floor(arr.length / 2),
    nums = arr.sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

function clearFields() {
	document.getElementById("belowX").innerHTML=""
	document.getElementById("aboveX").innerHTML=""
	document.getElementById("betweenX").innerHTML=""
	document.getElementById("outsideX").innerHTML=""
}

function enableTab(id) {
	var el = document.getElementById(id);
	el.onkeydown = function(e) {
		if (e.keyCode === 9) { // tab was pressed
			
			// get caret position/selection
			var val = this.value,
			start = this.selectionStart,
			end = this.selectionEnd;
			
			// set textarea value to: text before caret + tab + text after caret
			this.value = val.substring(0, start) + '\t' + val.substring(end);
			
			// put caret at right position again
			this.selectionStart = this.selectionEnd = start + 1;
			
			// prevent the focus lose
			return false;
			
		}
	};
}

function toggle(elmt){
	elmt.parentElement.classList.toggle("minimized")
	return false;
}

function pairScrollers(id1,id2){
	var s1 = document.getElementById(id1);
	var s2 = document.getElementById(id2);

	function select_scroll_1(e) { s2.scrollTop = s1.scrollTop; }
	function select_scroll_2(e) { s1.scrollTop = s2.scrollTop; }

	s1.addEventListener('scroll', select_scroll_1, false);
	s2.addEventListener('scroll', select_scroll_2, false);						
}

function innerHTMLof(elmt){
	return (exists(elmt)?document.getElementById(elmt).innerHTML:"")	
}


function openData(page, target, dataSource, title="",fromString=false){
//	if(parentWindow==null)
//	console.log(window.parent)
//	console.log(parent)
//	console.log(top)
//	var popup = (window.frameElement()==null?document.createElement('div'):window.frameElement.createElement('div'));
	var popup = parent.document.createElement('div')
//	console.log(target)
	popup.className = 'popup';
	var popupHeader = parent.document.createElement('div');
	popupHeader.innerText=title
	popupHeader.className='draggableHeader';
	popupHeader.style.backgroundColor=colorHex
	popup.appendChild(popupHeader)

	var popupClose = parent.document.createElement('div');
	popupClose.className='closer'
	popupClose.innerText="\u2716"
	popupClose.onclick=function(){closeMe(popup);};
	popupHeader.appendChild(popupClose)
	var popupMin = parent.document.createElement('div');
	var popupWin = parent.document.createElement('div');
	var popupMax = parent.document.createElement('div');
	popupMin.className='min'
	popupWin.className='win'
	popupMax.className='max'
	popupMin.innerText="\u{1F5D5}"
	popupWin.innerText="\u{1F5D7}"
	popupMax.innerText="\u{1F5D6}"
	popupMin.onclick=function(){minimize(popup);};
	popupMax.onclick=function(){maximize(popup);};
	popupWin.onclick=function(){windowize(popup);};
	
	popupHeader.appendChild(popupMin)
	popupHeader.appendChild(popupWin)
	popupHeader.appendChild(popupMax)
	
	var newFrame = parent.document.createElement('iframe');
	popup.appendChild(newFrame)
	newFrame.src=page
	
	var preloadData = []
	var targets = []
	if(Array.isArray(dataSource)){
		for(var i=0; i<dataSource.length; i++){
			preloadData[i]=(fromString?dataSource[i]:document.getElementById(dataSource[i]).innerHTML)
			targets[i]=target[i]
		}
	} else {
		preloadData[0]=(fromString?dataSource:document.getElementById(dataSource).innerHTML)
		targets[0]=target
	}
	
	document.body.appendChild(popup)
	dragElement(popup);

	topLevel++;
	popup.style.zIndex = topLevel
	
//	console.log(targets)
	if(typeof debug !== 'undefined' && debug)console.log(preloadData)
	
	newFrame.addEventListener("load", function() {
		this.contentWindow.document.getElementById('title').style.display='none';
		this.contentWindow.document.getElementById('menu').style.display='none';
		var anBtns=this.contentWindow.document.getElementsByClassName('analyzeButton');
		for(var i=0; i<anBtns.length;i++) anBtns[i].style.display='none'

		if(page=="survival.html"){
			if(preloadData[0]==2){
			this.contentWindow.document.getElementById(targets[1]).value=preloadData[1]
			this.contentWindow.refreshCovariates();
			}
		}

		if (page=="multipleRegression.html"){
			this.contentWindow.document.getElementById(targets[0]).value=preloadData[0]
			this.contentWindow.refreshCovariates();
		}
		
		for(var i=0; i<targets.length; i++)
			this.contentWindow.document.getElementById(targets[i]).value=preloadData[i]
		if(page=="dependentSamples.html"){
			this.contentWindow.updateResponse()
		}
		if(page=="contingencyTable.html"){
			this.contentWindow.generateTableFromData();
		}
		if (page=="multipleRegression.html"){
//			console.log("refreshing covariates false")
			this.contentWindow.refreshCovariates(false,false,preloadData[preloadData.length-1]);
//			console.log("updateChooseResponseVar")
			this.contentWindow.cleanData();
			this.contentWindow.updateChooseResponseVar();
			console.log("response var: "+preloadData[preloadData.length-1])
			this.contentWindow.document.getElementById('ChooseResponse').value = preloadData[preloadData.length-1]
		}
		if (page=="survival.html"){
			this.contentWindow.forceTabSwitch();
			this.contentWindow.cleanDataGrid();
			this.contentWindow.refreshCovariates();
		}
		if(page=='spatial.html'){
			if(targets[0]=='data0') this.contentWindow.document.getElementById('which0').click()
			if(targets[0]=='data1'){
				this.contentWindow.document.getElementById('which1').click()
			}
		}
		this.contentWindow.refresh()
	});
}

function minimize(divID){
	divID.classList.add('minFloater')
	divID.classList.remove('maxFloater')
}

function maximize(divID){
	divID.classList.add('maxFloater')
	divID.classList.remove('minFloater')
	divID.style.left="0px";
	divID.style.top="0px";
}

function windowize(divID){
	divID.classList.remove('maxFloater')
	divID.classList.remove('minFloater')
}

function loadData(theData){
	console.log("loaded "+theData);
}

function closeMe(divID){
	divID.remove()
}
			
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
	// if present, the header is where you move the DIV from:
	document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
	// otherwise, move the DIV from anywhere inside the DIV:
	elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
	e = e || window.event;
	e.preventDefault();
	// get the mouse cursor position at startup:
	pos3 = e.clientX;
	pos4 = e.clientY;
	document.onmouseup = closeDragElement;
	// call a function whenever the cursor moves:
	document.onmousemove = elementDrag;
	topLevel++;
	elmnt.style.zIndex = topLevel
  }

  function elementDrag(e) {
	if(elmnt.classList.contains('maxFloater'))return false;
	e = e || window.event;
	e.preventDefault();
	// calculate the new cursor position:
	pos1 = pos3 - e.clientX;
	pos2 = pos4 - e.clientY;
	pos3 = e.clientX;
	pos4 = e.clientY;
	// set the element's new position:
	elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
	elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
	if((elmnt.offsetTop - pos2)<0) elmnt.style.top="0px";
	if((elmnt.offsetLeft - pos1) <0) elmnt.style.left="0px";
  }

  function closeDragElement() {
	// stop moving when mouse button is released:
	document.onmouseup = null;
	document.onmousemove = null;
  }
}
  var topLevel = 10


			//computes the inverse of matrix A only if its determinant is nonzero
			function pinv(A) {
				if(numeric.det(A)==0) {
					return false
				} else {
					return numeric.inv(A)
				}
			}

			//transforms a variable - square root, etc
			function transform(x, transformation){
				if(transformation==0) return x
				if(transformation==1) return Math.pow(x,2)
				if(transformation==2) return Math.pow(x,3)
				if(transformation==3) return Math.log(x)
				if(transformation==4) return Math.sqrt(x)	
			}

			function onlyUnique(value, index, self) { 
				return self.indexOf(value) === index;
			}
			
			function isFloat(number){
				return(number%1!=0)
			}
			
function zoomThis(elmt){
	if(elmt.parentElement.style.zIndex==999){
		elmt.parentElement.style.position = 'relative';
		elmt.parentElement.style.zIndex=1;
		elmt.parentElement.style.backgroundColor="transparent";	
		elmt.parentElement.style.overflow="hidden";
	}else {
		elmt.parentElement.style.position = 'fixed';
		elmt.parentElement.style.backgroundColor="black";
		elmt.parentElement.style.top = 0;
		elmt.parentElement.style.right = 0;
		elmt.parentElement.style.bottom = 0;
		elmt.parentElement.style.left = 0;
		elmt.parentElement.style.zIndex=999;
		elmt.parentElement.style.minWidth=1000;
		elmt.parentElement.style.overflow="auto";
	}
	var oldHeight = elmt.height
	var oldWidth = elmt.width
	var hScale = elmt.parentElement.offsetHeight/elmt.height
	var wScale = elmt.parentElement.offsetWidth/elmt.width
	var scale = Math.max(hScale, wScale)
	elmt.width=elmt.width*scale
	elmt.height=elmt.height*scale
	refresh()
}
		

var sampleStatsNames=["Means","Medians","Std. Dev.","Variance","Q1","Q3","Sum", "Max","Min","IQR"]
var sampleStatsVals = [1,2,3,6,4,5,7,8,9,10]
		
function sampleStatOptions(){
	for(var i=0; i<sampleStats.length; i++){
		document.writeln("<option value="+sampleStatsVals[i]+" "+(i==0?" selected":"")+">"+sampleStatsNames[i]+"</option>\n")
	}
}
		
		
function sample(){
	var sampleSize = parseFloat(document.getElementById("sampleN").value)
	var nSamples = parseFloat(document.getElementById("nSamples").value)
	var sampleText = ""
	var sampleMeans = ""
	for(var i=0; i<nSamples; i++){
		var sum=0;
		for(var j=0; j<sampleSize; j++){
			var randomNumber = sampleOne()
			sampleText += randomNumber + " "
			sum += +parseFloat(randomNumber);
		}
		if(i<nSamples-1)sampleText += "\n"
		var mean= +(sum/sampleSize).toFixed(precision)
//		sampleMeans += mean + "\n"
	}
	document.getElementById("samples").innerHTML=sampleText
				recalcSampleStat()
//				document.getElementById("sampleMeans").innerHTML=sampleMeans
}

function recalcSampleStat(){
	var allSampleData = document.getElementById("samples").innerHTML
	var samples = allSampleData.split("\n");
	var sampleStatID=document.getElementById("sampleStat").value;
	var sampleStatistics="";
	for(var i=0; i<samples.length; i++){
		var sampleData = samples[i].trim().split(" ");
		var data=[]
		for(var k=0; k<sampleData.length; k++) 
			data.push(+sampleData[k]);
		data.sort(function(a, b){return a-b})
		if(debug)console.log(data)
		var sampleStat = 0
		var FNS = fiveNumSum(data)
		if(sampleStatID==1) sampleStat = fixed(jStat.mean(data));
		if(sampleStatID==2) sampleStat = fixed(FNS[2]);
		if(sampleStatID==3) sampleStat = fixed(jStat.stdev(data,true));
		if(sampleStatID==4) sampleStat = fixed(FNS[1]);
		if(sampleStatID==5) sampleStat = fixed(FNS[3]);
		if(sampleStatID==6) sampleStat = fixed(jStat.variance(data,true));
		if(sampleStatID==7) sampleStat = fixed(jStat.sum(data));
		if(sampleStatID==8) sampleStat = fixed(jStat.max(data));
		if(sampleStatID==9) sampleStat = fixed(jStat.min(data));
		if(sampleStatID==10) sampleStat = fixed(FNS[3]-FNS[1]);
		sampleStatistics += (i>0?"\n":"") + sampleStat
	}
	document.getElementById("sampleMeans").innerHTML=sampleStatistics
}
		
		
function nameSampleMeansWindow(){
	return "Sample "+ document.getElementById('sampleStat')[document.getElementById('sampleStat').selectedIndex].text+" ("+document.getElementById('sampleN').value+")"
}


			
document.onclick= function(e){
   e=window.event? event.srcElement: e.target;
   if(e.className && e.className.indexOf('zoomable')!=-1) zoomThis(e);
}			




//-----------------------------------------------
// Building Content
//-----------------------------------------------
function buildPanel(panelid, panelTitle, options=[],help=""){
	var HTMLcontent = ""
	HTMLcontent+='<input type="checkbox" id="header'+panelTitle+'" class="css-checkbox">'
	HTMLcontent+='<label for="header'+panelTitle+'" class="css-label">Sampling</label>'
	HTMLcontent+='<div class="content css-content">'
	if(help!=""){
		HTMLcontent+='				<div class=\'helpDiv minimized\'>'
		HTMLcontent+='					<a  onClick=\'toggle(this);\' class=\'expander\'>?</a>'
		HTMLcontent+='					<a  onClick=\'toggle(this);\' class=\'collapser\'>&#10006;</a>'
		HTMLcontent+='					<span>'+help+'</span>'
		HTMLcontent+='				</div>'
	}
	HTMLcontent+= buildContent(panelid,options)
	HTMLcontent+="</div>"
	document.getElementById(panelid+'-container').innerHTML=HTMLcontent
	supplementalScript(panelid)
}

function supplementalScript(panelid){
	if(panelid=="sampling"){
		pairScrollers('samples','sampleMeans')
	}
}

function buildContent(panelid,options=[]){
	contentString = "<div id=\""+panelid+"\" class=\"content\">"	
	if(panelid=="sampling"){
	contentString+="	Sample Size: <input type=\"number\" id=\"sampleN\" value=\"5\" class=\"smallNumber\" min=\"1\" step=\"1\"  />"
	contentString+="	Number of Samples: <input type=\"number\" id=\"nSamples\" value=\"30\"  class=\"smallNumber\" min=\"1\" step=\"1\"  /> <br/>"
	if(options.length>0 && options[0]){
		contentString+="				<select id=\"samplingReplacement\"  onChange=\"if(parseInt(document.getElementById('sampleN').value) > parseInt(document.getElementById('stat_n1').innerHTML)){document.getElementById('withReplacement').selected=true}\">"
		contentString+="					<option value=\"without replacement\" selected>Without replacement</option>"
		contentString+="					<option value=\"with replacement\" id='withReplacement'>With replacement</option>"
		contentString+="				</select>		"
	}
	contentString+="	<button TYPE=button VALUE=\"Sample\" onClick=\"sample()\"/>Sample</button><br/>"
	contentString+="	<div class='results'>"
	contentString+="	<table class='samplesTable'>"
	contentString+="		<tr><td width=65%>Samples</td><td width=30%>Sample <select id=\"sampleStat\" onChange=\"recalcSampleStat();\">"
	for(var i=0; i<sampleStatsNames.length; i++){
		contentString+="			<option value="+sampleStatsVals[i]+" "+(i==0?" selected":"")+">"+sampleStatsNames[i]+"</option>\n"
	}
	contentString+="			</select>"
	contentString+="		</td></tr>"
	contentString+="		<tr><td style=\"vertical-align:top;\"><textarea onMousemove=\"getElementById('sampleMeans').style.height=this.style.height;\" name=\"samples\" id=\"samples\" rows=10 style=\"white-space: pre; width:100%;\" class=\"mediumTextArea\" readonly></textarea></td>"
	contentString+="		<td style=\"vertical-align:top;\"><textarea  onMousemove=\"getElementById('samples').style.height=this.style.height;\" name=\"sampleMeans\" id=\"sampleMeans\" rows=10 style=\"white-space: pre; width:100%;\" class=\"mediumTextArea\" readonly></textarea></td></tr>"
	contentString+="		<tr><td></td><td><button type='button' value='analyze' class='analyzeButton' onClick='openData(\"descriptiveStats.html\",\"data1\",\"sampleMeans\",nameSampleMeansWindow());'>analyze</button></td></tr>"
	contentString+="	</table>"
	contentString+="</div>"
	}
	contentString +="	</div>"
	return contentString
}
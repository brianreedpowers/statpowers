function cdf(x, param1, param2){
	if(distribution=='exponential'){
		return jStat.gamma.cdf( x,param1,param2)
	} else if (distribution=='uniform'){
		return (x-param1)/(param2-param1)
	} else if (distribution=='chiSq'){
		return jStat.chisquare.cdf(x,param1)
	} else if (distribution=='F'){
		return jStat.centralF.cdf(x,param1,param2)
	} else if (distribution=='Gaussian'){
		return jStat.normal.cdf(x,param1,param2)
	} else if (distribution=='log-normal'){
		return jStat.normal.cdf(Math.log(x),param1,param2)
	} else if (distribution=='T'){
		return jStat.studentt.cdf(x,param1)
	} else if (distribution=='Gamma'){
		return jStat.gamma.cdf(x,param1,param2)
	} else if (distribution=='Beta'){
		return jStat.beta.cdf(x,param1,param2)
	} else if (distribution=='Weibull'){
		return jStat.weibull.cdf(x,param2,param1)
	} else if (distribution=='Wilson'){
		return 1;
	} else if (distribution=='Tukey'){
		return (jStat.tukey.cdf(x,param1,param2))
//		return (tukeycdf(x,param1,param2))
	}else if (distribution=='Pareto'){
		return (x<param2?0:Math.min(1,1-Math.pow(param2/x,param1)))
	}
}

function inv(p,param1,param2){
	if(distribution=='exponential'){
		return jStat.gamma.inv( p,param1,param2)
	} else if (distribution=='uniform'){
		return param1+p*(param2-param1)
	} else if (distribution=='chiSq'){
		return jStat.chisquare.inv(p,param1)
	} else if (distribution=='F'){
		return jStat.centralF.inv( p,param1,param2)
	} else if (distribution=='Gaussian'){
		return jStat.normal.inv( p,param1,param2)
	} else if (distribution=='log-normal'){
		return Math.exp(jStat.normal.inv( p,param1,param2))
	} else if (distribution=='T'){
		return jStat.studentt.inv(p,param1)
	} else if (distribution=='Gamma'){
		return jStat.gamma.inv( p,param1,param2)
	} else if (distribution=='Beta'){
		return jStat.beta.inv( p,param1,param2)
	} else if (distribution=='Weibull'){
		return jStat.weibull.inv(p,param2,param1)
	} else if (distribution=='Tukey'){
		return jStat.tukey.inv(p,param1,param2)
	} else if (distribution=='Wilson'){
		return wilson_inv(p,param1,param2)
	} else if (distribution=='Pareto'){
		return (param2*Math.pow(1-p,-1/param1))
	}
}

function wilson_inv(p, x, n){
	var z = jStat.normal.inv(p,0,1)
	var middleWilson = (2*x + Math.pow(z,2))/(2*(n + Math.pow(z,2)))
	var marginWilson = z/(2*(n + Math.pow(z,2))) * Math.sqrt(Math.pow(z,2)+4*x*(1-x/n))
	return (middleWilson + marginWilson)
}

var wilsonX=null; wilsonN=null;
var wilsonDensity=[];
var wilsonCDF=[];  //q=0 to 1; 100 indices.
var wilsonBreaks=500;
var wilsonMaxDensity = null;

function wilson_cdf(q,x,n){
	q = Math.max(Math.min(Math.round(q*wilsonBreaks),wilsonBreaks),0);
	if(wilsonX!=x || wilsonN!=n){
		reviseWilsonDistr(x,n);
	}		
	return wilsonCDF[q];
}

function wilson_pdf(q,x,n){
//	console.log("wilson pdf");
	q = Math.max(Math.min(Math.round(q*wilsonBreaks),wilsonBreaks),0);
	if(wilsonX!=x || wilsonN!=n){
		reviseWilsonDistr(x,n);
	}		
	return wilsonDensity[q];
}

function reviseWilsonDistr(x,n){
	console.log("revising wilson distr");
	var qWilson = []
	wilsonMaxDensity=0
	for(var i=0; i<=500; i++){
		qWilson[i]=wilson_inv(i/500,x,n)
	}
//	console.log(qWilson)
	var cumP=0; atQ=0;
	for(var i=0; i<qWilson.length-1; i++){
		var q1=qWilson[i]*wilsonBreaks; q2=qWilson[i+1]*wilsonBreaks
		for(var j=Math.floor(q1); j<=q2; j++){
			wilsonCDF[j]= Math.min(Math.max(0,cumP + ((j-q1)/(q2-q1))/qWilson.length),1)
		}
		cumP+=1/qWilson.length;
	}
	wilsonCDF[wilsonBreaks]=1
	for(var i=0; i<wilsonCDF.length-1; i++){
		wilsonDensity[i]=wilsonCDF[i+1]-wilsonCDF[i]
		wilsonMaxDensity=Math.max(wilsonMaxDensity, wilsonDensity[i])
	}
	wilsonDensity[wilsonBreaks]=wilsonDensity[wilsonBreaks-1];
	wilsonX=x; wilsonN=n;
	console.log(wilsonCDF);
	console.log(wilsonDensity);
	console.log(wilsonMaxDensity);
}

function density(x, param1, param2){
//	console.log("calling density("+x+","+param1+","+param2+")")
	if(distribution=='exponential'){
		return jStat.gamma.pdf( x,param1,param2)
	} else if (distribution=='uniform'){
		return 1/(param2-param1)
	} else if (distribution=='chiSq'){
		return jStat.chisquare.pdf(x,param1)
	} else if (distribution=='F'){
		return jStat.centralF.pdf(x,param1, param2)
	} else if (distribution=='Gaussian'){
		return jStat.normal.pdf(x,param1, param2)
	} else if (distribution=='log-normal'){
		return (1.0/(x*param2*Math.sqrt(pi2))*Math.exp(-Math.pow((Math.log(x)-param1)/param2,2)/2))
	} else if (distribution=='T'){
		return jStat.studentt.pdf(x,param1)
	} else if (distribution=='Gamma'){
		return jStat.gamma.pdf(x,param1, param2)
	} else if (distribution=='Tukey'){
//		var delta=(bounds(param1,param2)[1]-bounds(param1,param2)[0])/300
//		return ((jStat.tukey.cdf(x+delta,param1, param2)-jStat.tukey.cdf(x,param1, param2))/delta)
		return srngpdf(x,param1,param2)
	} else if (distribution=='Beta'){
		if(param1>param2){
//			if(x>.98 || x<.02){
//				console.log("Beta("+param1+","+param2+")("+x+")="+jStat.beta.pdf(x,param1,param2))
//				console.log("Beta("+param2+","+param1+")("+(1-x)+")="+jStat.beta.pdf(1-x,param2,param1))
//			}
			return jStat.beta.pdf(1-x,param2, param1)
		}else {
			return jStat.beta.pdf(x,param1, param2)
		}
	} else if (distribution=='Weibull'){
		return jStat.weibull.pdf(x,param2,param1)
	}else if (distribution=='Pareto'){
		return (param1*Math.pow(param2,param1)/(Math.pow(x,param1+1)))
	}else if (distribution=="Wilson"){
		return wilson_pdf(x,param1,param2);
	}
}

var savedParams = []
var savedQrng = []
var savedQstep =0
var savedDensity = []
var savedMaxDensity=0
var srngMethod=1

function srngpdf(x, k, v){
	if(savedParams[0]!=k || savedParams[1]!=v){
		savedMaxDensity=0
		var maxDensityAt=0
		savedQrng = bounds(k,v).slice()
		savedQstep = (savedQrng[1]-savedQrng[0])/100
		savedDensity = []
		if(srngMethod==1){
	//		var A = k*(k-1)*Math.pow(v,v/2)/(math.gamma(v/2) * Math.pow(2,v/2-1))
			var A=0
	//		if(k==2 || k==3) A=1
			var sMax = 3.5/Math.sqrt(v)*2
			sMax = Math.max(v/k,3.5/Math.sqrt(v))
			var sDelta = (sMax)/50
	//		console.log(sMax + " by "+sDelta)
	//		console.log("q in ["+savedQrng+"]")
			for(var q=savedQrng[0]; q<=savedQrng[1]; q+=savedQstep){
				var d=0,yy1=null
	//			if(k==2){
	//				d=Math.sqrt(2)*jStat.normal.pdf(q/Math.sqrt(2),0,1)
	//			} else if (k==3){
	//				d=6*Math.sqrt(2)*jStat.normal.pdf(q/Math.sqrt(2),0,1)*(jStat.normal.cdf(q/Math.sqrt(6),0,1)-.5)				
	//			} else {
					var epsilon = 0.000000001
					for(var s=sDelta*.001; s<=sMax*10; s+=sDelta){
						var B=0, zBounds = [-3.5-q*s,3.5],y1= null //[Math.min(-3.5, -3.5-q*s), Math.max(3.5,3.5-q*s)]
		//				console.log("s="+s+"; zBounds=["+zBounds+"]")
						var zDelta = (zBounds[1]-zBounds[0])/25
						for(z=zBounds[0]; z<=zBounds[1]; z+=zDelta){
							var zqs=z+q*s
							var y2= jStat.normal.pdf(zqs,0,1)*jStat.normal.pdf(z,0,1)*(k==2?1.0:Math.pow(jStat.normal.cdf(zqs,0,1)-jStat.normal.cdf(z,0,1),k-2))
							if(y1!=null) B += (y1+y2)/2
							y1=y2
						}
						B*= zDelta
		//				yy2=Math.pow(s,v)*jStat.normal.pdf(Math.sqrt(v)*s,0,1)*B
	//					yy2=Math.pow(s,v)*Math.exp(-(v*s*s/2))*B
						yy2=Math.pow(s/Math.exp(s*s/2),v)*B
						if(yy1!=null) {
							d +=  (yy2+yy1)/2
							if(s>sMax && yy2 < epsilon) break;
						}
						yy1=yy2
					}
					d *= sDelta
	//			}
				if(d>savedMaxDensity){
					savedMaxDensity=d;
					maxDensityAt=savedDensity.length
				}
	//			savedMaxDensity = Math.max(savedMaxDensity, d)
				savedDensity.push(d)
				A += d
			}
			savedDensity.push(0)
			A *= savedQstep
			for(var i=0; i<savedDensity.length; i++){
				savedDensity[i] *= (1.0/A)
			}
		} else {
			var p_prev = 0
			for(var q=savedQrng[0]; q<=savedQrng[1]; q+=savedQstep){
				var p_curr = cdf(q, k,v)
				if(q>savedQrng[0]){
					var d=(p_curr-p_prev)/savedQstep
					savedDensity.push(d)
					if(d>savedMaxDensity){
						savedMaxDensity=d;
						maxDensityAt=savedDensity.length
					}
				}
				p_prev=p_curr
			}
			savedDensity.push((1-p_curr)/savedQstep)
		}
		savedMaxDensity = savedDensity[maxDensityAt]
		
		savedParams=[k,v]
	}
	//interpolate
	var idx = Math.min(Math.floor(x/savedQstep), savedDensity.length-2)
	var alpha = (x % savedQstep)/savedQstep
	var returnDensity = savedDensity[idx]*(1-alpha) + savedDensity[idx+1]*alpha
	return (returnDensity)
}

function maximumDensity(param1,param2){
	if(distribution=='exponential'){
		return density((param1-1)*param2,param1,param2);
	} else if (distribution=='uniform'){
		return 1/(param2-param1)
	} else if (distribution=='chiSq'){
		return Math.max(jStat.chisquare.pdf(.01,param1),jStat.chisquare.pdf(Math.max(param1-2,.01),param1))	
	} else if (distribution=='F'){
		if(param1>2) {return jStat.centralF.pdf((param1-2)/param1*param2/(param2+2),param1,param2)}
		else {return jStat.centralF.pdf(.0001,param1,param2)}
	} else if (distribution=='Gaussian'){
		return jStat.normal.pdf(param1,param1, param2)
	} else if (distribution=='Tukey'){
		if(savedParams[0]!=param1 || savedParams[1]!=param2){
			var d=srngpdf(1,param1,param2)
		}
		return savedMaxDensity
	} else if (distribution=='log-normal'){
		return density(Math.exp(param1-param2*param2),param1,param2)
//		return (1.0/(Math.exp(param1)*param2*Math.sqrt(pi2)))
	} else if (distribution=='T'){
		return jStat.studentt.pdf(0,param1)
	} else if (distribution=='Gamma'){
		if(param1>1) {return jStat.gamma.pdf( (param1-1)*param2,param1,param2)}
		else {return jStat.gamma.pdf(.0001,param1,param2)}
	} else if (distribution=='Beta'){
		if(param1>param2){
			var temp=param2
			param2=param1
			param1=temp
		}
		if(param1<1 && param2>1) {return jStat.beta.pdf( 0.0001,param1,param2)}
		else if(param1>1 && param2<1) {return jStat.beta.pdf(0.9999,param1,param2)}
		else if(param1>1 && param2>1) {return jStat.beta.pdf( (param1-1)/(param1+param2-2),param1,param2)}
		else {return jStat.beta.pdf(.0001,param1,param2)}
	} else if (distribution=='Weibull'){
		if(param1<1) return Math.min(density(bounds(param1,param2)[0],param1,param2),2.5)
		return jStat.weibull.pdf(  param2*Math.pow((param1-1)/param1, 1/param1),param2,param1)
	} else if (distribution=="Pareto"){
		return density(param2,param1,param2)
	} else if(distribution=="Wilson"){
		if(wilsonX!=param1 || wilsonN!=param2){
			reviseWilsonDistr(param1,param2);
		}		
		return wilsonMaxDensity;
	}
}

function bounds(param1,param2){
	var bounds = new Array();
	if(distribution=='exponential'){
		bounds[0]= 0;
		bounds[1]=param1*param2*5
	} else if (distribution=='uniform'){
		bounds[0]=param1
		bounds[1]=param2
	} else if (distribution=='chiSq'){
		bounds[0] =  0.01
		bounds[1] = inv(.999, param1, param2)	
	} else if (distribution=='F'){
		bounds[0] = 0.0001
		bounds[1] = jStat.centralF.inv(.995,param1,param2)	
	} else if (distribution=='Gaussian'){
		bounds[0] = param1-3.5*param2
		bounds[1] = param1+3.5*param2	
	} else if (distribution=='log-normal'){
		bounds[0] = 0.0001;
		bounds[1] = inv(.999,param1,param2)
	} else if (distribution=='T'){
		bounds[0] = -3.5
		bounds[1] = 3.5
	} else if (distribution=='Gamma'){
		bounds[0] = 0.0001
		bounds[1] = jStat.gamma.inv(.999,param1,param2)	
	} else if (distribution=='Tukey'){
		bounds[0] = 0.0001
		bounds[1] = jStat.tukey.inv(.99,param1,param2)	
	} else if (distribution=='Beta'){
		bounds[0] = 0.0001
		bounds[1] = 0.9999
	} else if (distribution=='Weibull'){
		bounds[0] = (param1<1?.01:0);
		bounds[1] = inv(.99,param1,param2)
	}else if (distribution=='Pareto'){
		bounds[0] = param2;
		bounds[1] = inv(.99,param1,param2)
	} else if (distribution=="Wilson"){
		bounds[0]=0;
		bounds[1]=1;
	}
//	console.log(bounds)
	return bounds
}

function generatePDF(param1, param2){
	pdfString="\\(f(x)="
	if(distribution=='exponential'){
		lambda=fixed(1/param2)
		pdfString +=lambda + "e^{-"+(lambda!=1?lambda:"")+"x}, x \\geq 0"
	} else if (distribution=='uniform'){
		a=fixed(param1)
		b=fixed(param2)
		pdfString += "   \\frac{1}{"+(b-a)+"}, "+a+"\\leq x \\leq "+b
	} else if (distribution=='chiSq'){
		k = fixed(param1)
		pdfString += "\\frac{1}{2^{"+fixed(k/2)+"} \\Gamma("+fixed(k/2)+")} "+(k!=2?"x":"")+(k!=2 && k!=4?"^{"+fixed(k/2-1)+"}":"")+"e^{-x/2}, x "+(k>1?"\\geq":">")+"0"
	} else if (distribution=='F'){
		d1=fixed(param1)
		d2=fixed(param2)
		pdfString +="\\frac{ \\sqrt{ \\frac{ "+(d1==1?"x":"("+d1+"x)^{"+d1+"}")+d2+"^{"+d2+"}}{("+d1+"x+"+d2+")^{"+(d1+d2)+"} } } } {x B\\left("+(d1/2)+","+(d2/2)+"\\right)}, x "+(d1!=1?"\\geq":">")+"0"
	} else if (distribution=='Gaussian'){
		mu=fixed(param1)
		sigma=fixed(param2)
		pdfString += "\\frac{1}{"+sigma+" \\sqrt{2 \\pi}} e^{-\\frac{1}{2}\\left( \\frac{x"+(mu>0?'-'+mu:(mu<0?'+'+(-mu):''))+"}{"+sigma+"}\\right)^2}"
	} else if (distribution=='log-normal'){
		mu=fixed(param1)
		sigma=fixed(param2)
		pdfString += "\\frac{1}{x"+sigma+" \\sqrt{2 \\pi}} e^{- \\frac{(\\ln(x)"+(mu>0?'-'+mu:(mu<0?'+'+(-mu):''))+")^2}{2\\cdot"+sigma+"^2}}, x > 0"
	} else if (distribution=='T'){
		v = fixed(param1)
		pdfString += "\\frac{ \\Gamma( "+fixed((v+1)/2)+")} { \\sqrt{"+v+"\\pi} \\Gamma("+fixed(v/2)+")} \\left(1+\\frac{x^2}{"+v+"}\\right)^{"+fixed(-(v+1)/2)+"}"
	} else if (distribution=='Gamma'){
		k = fixed(param1)
		theta = fixed(param2)
		pdfString += "\\frac{1}{\\Gamma("+k+")"+(theta!=1?theta+(k!=1?"^{"+k+"}":""):"")+"}"+(k!=1?"x"+(k!=2?"^{"+fixed(k-1)+"}":""):"")+"e^{-\\frac{x}{"+theta+"}}, x>0"
	} else if (distribution=='Tukey'){
		pdfString += "(complicated)"
	} else if (distribution=='Beta'){
		a=fixed(param1)
		b=fixed(param2)
		pdfString += "\\frac{ x"+(a!=2?"^{"+fixed(a-1)+"}":"")+"(1-x)"+(b!=2?"^{"+fixed(b-1)+"}":"")+"}{B("+a+","+b+")}, 0 \\lt x \\lt 1"
	} else if (distribution=='Weibull'){
		param1=fixed(param1)
		param2=fixed(param2)
		pdfString += "   \\frac{"+param2+"}{"+param1+"}\\left(\\frac{x}{"+param1+"}\\right)^{"+(param2-1)+"}e^{-(x/"+param1+")^{"+param2+"}}"
		pdfString += ", x \\geq 0"
		
	}else if (distribution=='Pareto'){
		param1=fixed(param1)
		param2=fixed(param2)
		pdfString += "   \\frac{"+param1+"\\cdot"+param2+"^{"+param1+"}}{x^{"+(param1+1)+"}}"
		pdfString += ", x \\geq 0"
	}
	pdfString +="\\)"
	return pdfString	
}

function getWikiLink(){
	if(distribution=='exponential'){
		return "https://en.wikipedia.org/wiki/Exponential_distribution"
	} else if (distribution=='uniform'){
		return "https://en.wikipedia.org/wiki/Continuous_uniform_distribution"
	} else if (distribution=='chiSq'){
		return "https://en.wikipedia.org/wiki/Chi-squared_distribution"
	} else if (distribution=='F'){
		return "https://en.wikipedia.org/wiki/F-distribution"
	} else if (distribution=='Gaussian'){
		return "https://en.wikipedia.org/wiki/Normal_distribution"
	} else if (distribution=='log-normal'){
		return "https://en.wikipedia.org/wiki/Log-normal_distribution"
	} else if (distribution=='T'){
		return "https://en.wikipedia.org/wiki/Student%27s_t-distribution"
	} else if (distribution=='Gamma'){
		return "https://en.wikipedia.org/wiki/Gamma_distribution"
	} else if (distribution=='Beta'){
		return "https://en.wikipedia.org/wiki/Beta_distribution"
	} else if (distribution=='Weibull'){
		return "https://en.wikipedia.org/wiki/Weibull_distribution"
	} else if (distribution=="Tukey"){
		return "https://en.wikipedia.org/wiki/Studentized_range_distribution"
	} else if (distribution=="Pareto"){
		return "https://en.wikipedia.org/wiki/Pareto_distribution"
	}
	return ""
}

function getProperties(a,b){
	var props=[0,0,0]
	if(distribution=='exponential'){
		props=[b, (b*b), b]
	} else if (distribution=='uniform'){
		props=[.5*(a+b),  1/12 * Math.pow(b-a,2), Math.sqrt(1/12 * Math.pow(b-a,2))]
	} else if (distribution=='chiSq'){
		props=[a,2*a, Math.sqrt(2*a)]
	} else if (distribution=='F'){
		props[0]=(b>2? b/(b-2):"undefined")
		props[1]=(b>4? (2*b*b*(a+b-2))/(a*(b-2)*(b-2)*(b-4)):"undefined")
		props[2]=(b>4? Math.sqrt(props[1]):"undefined")
	} else if (distribution=='Gaussian'){
		return [a,b*b,b]
	} else if (distribution=='log-normal'){
		props[0]=Math.exp(a+b*b/2)
		props[1]=(Math.exp(b*b)-1)*Math.exp(2*a+b*b)
		props[2]=Math.sqrt(props[1])
	} else if (distribution=='T'){
		props[0]=(a>1?0:"undefined")
		props[1]=(a>2? a/(a-2) : (a>1? "&infin;":"undefined"))
		props[2]=(a>2? Math.sqrt(props[1]): props[1])
	} else if (distribution=='Gamma'){
		props=[a*b, a*b*b, Math.sqrt(a*b*b)]
	} else if (distribution=='Beta'){
		props=[a/(a+b), a*b/( (a+b)*(a+b) * (a+b+1)),0]
		props[2]=Math.sqrt(props[1])
	} else if (distribution=='Weibull'){
		props[0]=b * jStat.gammafn(1+1/a)
		props[1]=b*b*(jStat.gammafn(1+2/a) - Math.pow(jStat.gammafn(1+1/a),2))
		props[2]=Math.sqrt(props[1])
	} else if(distribution=="Pareto"){
		props[0]=(a<=1?"&infin;":(a*b/(a-1)))
		props[1]=(a<=2?"&infin;":(a*b*b/((a-1)*(a-1)*(a-2))))
		props[2]=(a<=2?"&infin;":Math.sqrt(props[1]))
	} else{ props=[null,null,null]}
	return props	
}

function tukeycdf(q, r, v){
	var vw=[], qw=[], pcutj=0.00003, pcutk=0.0001, step=.45, vmax=120
	var cv1=0.193064705, cv2=0.293525326, cvmax=0.39894228, cv=[0.318309886, -0.00268132716, 0.00347222222, 0.0833333333]
	var jmin=3, jmax=15, kmin=7, kmax=15, prtng=0
	
	if(v<1 || r<2) return false;
	if(q<=0) return false;
	
	var g = step*Math.pow(r,-.2)
	var gmid = .5*Math.log(r)
	var r1 = r-1
	var c=Math.log(r*g*cvmax)
	if(c <=vmax){
		var h=step*Math.pow(v, -.5)
		var v2 = v/2
		if(v==1){ c=cv1}
		else if(v==2){ c=cv2}
		else{ c=Math.sqrt(v2)*cv[0]/(1+(cv[2]/v2 + cv[2]/v2+cv[3])/v2)}
	}
	var gstep=g
	qw[0]=-1
	qw[jmax]=-1
	var pk1=1, pk2=1
	for(var k=1; k<=kmax; k++){
		gstep -= g
		//line 21
		do{
		gstep = -gstep 
		var gk = gmid + gstep
		var pk=0
		if(!(pk2 <= pcutk && k > kmin)){ //Go to 26}
			var w0 = c-gk*gk/2
			var x = jStat.normal.cdf(gk,0,1)-jStat.normal.cdf(gk-q,0,1)
			if(x>0){ pk = Math.exp(w0 + r1 + Math.log(x))}
			if(v <= vmax){ 
				var jump = -jmax 
				do{		//line 22
					jump += jmax
					for(var j=1; j<=jmax; j++){
						var jj = j+jump
						if(qw[jj-1] <=0){
							var hj = h+j
							if(j < jmax){ qw[jj]=-1}
							var ehj = Math.exp(hj)
							qw[jj-1]=q*ehj
							vw[jj-1]=v*(hj + .5 - ehj*ehj *.5)
						}
						pj=0
						x=jStat.normal.cdf(gk,0,1)-jStat.normal.cdf(gk-qw[jj-1],0,1)
						if(x>0){pj = Math.exp(w0 + vw[jj-1] + r1*Math.log(x))}
						pk = pk + pj
						if(pj <=pcutj && (jj>jmin || k > kmin)){j=jmax+1;break;}
					}
					h = -h
				} while (h<0)
			}
		}
		var prtrng = prtrng + pk
	if(k>kmin && pk <= pcutk && pk1 <= pcutk) {k=kmax+1;break}
		pk2=pk1
		pk1=pk
		}while(gstep>0)
	}
	return prtrng
}

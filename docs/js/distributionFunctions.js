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
	}else if (distribution=='Pareto'){
		return (param2*Math.pow(1-p,-1/param1))
	}
}

function density(x, param1, param2){
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
	} else if (distribution=='Beta'){
		if(param1>param2){
			if(x>.98 || x<.02){
//				console.log("Beta("+param1+","+param2+")("+x+")="+jStat.beta.pdf(x,param1,param2))
//				console.log("Beta("+param2+","+param1+")("+(1-x)+")="+jStat.beta.pdf(1-x,param2,param1))
			}
			return jStat.beta.pdf(1-x,param2, param1)
		}else {
			return jStat.beta.pdf(x,param1, param2)
		}
	} else if (distribution=='Weibull'){
		return jStat.weibull.pdf(x,param2,param1)
	}else if (distribution=='Pareto'){
		return (param1*Math.pow(param2,param1)/(Math.pow(x,param1+1)))
	}
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
		return jStat.weibull.pdf(  param2*Math.pow((param1-1)/param1, 1/param1),param2,param1)
	} else if (distribution=="Pareto"){
		return density(param2,param1,param2)
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
	} else if (distribution=='Beta'){
		bounds[0] = 0.0001
		bounds[1] = 0.9999
	} else if (distribution=='Weibull'){
		bounds[0] = 0;
		bounds[1] = inv(.999,param1,param2)
	}else if (distribution=='Pareto'){
		bounds[0] = param2;
		bounds[1] = inv(.99,param1,param2)
	}
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
	}
	return props	
}

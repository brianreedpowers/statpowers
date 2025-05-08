function Abs(x) { return Math.abs(x) }
function Sqrt(x) { return Math.sqrt(x) }
function Exp(x) { return Math.exp(x) }
function Ln(x) { return Math.log(x) }
function Power(x,y) { return Math.pow(x,y) }

var Pi = 3.141592653589793;
var cphmCoeff=[]
var cphmMeans=[]

function ChiSq(x,n) {
    var p=Math.exp(-0.5*x); if((n%2)==1) { p=p*Math.sqrt(2*x/Pi) }
    var k=n; while(k>=2) { p=p*x/k; k=k-2 }
    var t=p; var a=n; while(t>0.000001*p) { a=a+2; t=t*x/a; p=p+t }
    return 1-p
}

function Norm(z) { return ChiSq(z*z,1) }

function Fmt(x) { var v;
	if(x>=0) { v="          "+(x+0.00005) } else { v="          "+(x-0.00005) }
	v = v.substring(0,v.indexOf(".")+5)
	return v.substring(v.length-10,v.length)
	}

function Fmt3(x) { 
	var v= "   " + x;
	return v.substring(v.length-3,v.length)
}

function Xlate(s,from,to) { var v = s;
	var l=v.indexOf(from);
	while(l>-1) {
		v = v.substring(0,l) + to + v.substring(l+1,v.length);
		l=v.indexOf(from)
		}
	return v
    }

function crArr(n) {
	this.length = n;
	for (var i = 0; i < this.length; i++) { this[i] = 0 }
	}
	
function ix(j,k,nCols) { return j * nCols + k }

var CR = unescape("%0D");
var LF = unescape("%0A");
var Tb = unescape("%09");
var NL = CR + LF;
var cphmMeanPower =0
function fitCPHM() {

	var i = 0; var j = 0; var k = 0; var l = 0;

	var nC   = X[0].length; //eval(form.cPts.value); //nC is the number of data points
	var nR   = X.length;    //eval(form.cVar.value); //nR is the number of Covariates - columns

//	console.log(nC + " "+nR)

	var SurvT = new crArr( nC );
	var Stat  = new crArr( nC );
	var Dupl  = new crArr( nC );
	var Alpha = new crArr( nC );
	var x     = new crArr( nC * nR );
	var b     = new crArr( nC );
	var a     = new crArr( nR * ( nR + 1 ) );
	var s1    = new crArr( nR );
	var s2    = new crArr( nR * nR );
	var s     = new crArr( nR );
	var Av    = new crArr( nR );
	var SD    = new crArr( nR );
	var SE    = new crArr( nR );


	da=""
	for(var i=0; i<X[0].length; i++){
		for(var j=0; j<X.length; j++){
			da+=X[j][i]+","
		}
		da+=Y[i]+","+(1-Yc[i])
		if(i<X[0].length-1) da+="\n"
	}
	if(debug)console.log(da)

	if( da.indexOf(NL)==-1 ) { if( da.indexOf(CR)>-1 ) { NL = CR } else { NL = LF } }

	for (i = 0; i<nC; i++) {
		l = da.indexOf(NL); if( l==-1 ) { l = da.length };
		var v = da.substring(0,l);
		da = da.substring(l+NL.length,da.length);

		for (j = 0; j<nR; j++) {
			l = v.indexOf(","); if( l==-1 ) { l = v.length };
			var zX = eval(v.substring(0,l))
			x[ix(i,j,nR)] = zX;
			Av[j] = Av[j] + zX;
			SD[j] = SD[j] + zX*zX;
			v = v.substring(l+1,v.length);
			}
		l = v.indexOf(","); if( l==-1 ) { l = v.length };
		SurvT[i] = eval(v.substring(0,l));
		v = v.substring(l+1,v.length);
		l = v.indexOf(","); if( l==-1 ) { l = v.length };

		var z = v.substring(0,l);
		v = v.substring(l+1,v.length);
		if ( z.indexOf("C")>=0 ) { z = "0" }
		if ( z.indexOf("c")>=0 ) { z = "0" }
		if ( z.indexOf("D")>=0 ) { z = "1" }
		if ( z.indexOf("d")>=0 ) { z = "1" }
		if ( z.indexOf("A")>=0 ) { z = "0" }
		if ( z.indexOf("a")>=0 ) { z = "0" }
		Stat[i] = eval(z);
		if ( Stat[i]!=0 ) { Stat[i] = 1 }

		}
	cphmMeans=[]
	var o = "<strong>Descriptive Stats</strong>" + NL;
	o = o + ( "<table><tr><th>Variable</th><th>Mean</th><th>SD</th><tr>" + NL );
	for (j = 0; j<nR; j++) {
		Av[j] = Av[j] / nC;
		cphmMeans[j]=Av[j]
		SD[j] = SD[j] / nC;
		SD[j] = Sqrt( Abs( SD[j] - Av[j] * Av[j] ) )
		o = o + (  "<tr><td>" + modelVarNames[j+1] + "</td><td>" + fixed(Av[j]) +"</td><td>"+ fixed(SD[j])+ "</td></tr>\n" );
	}
	o+="</table>"
	//form.output.value = o;

	var Eps = 1 / 1024;
	for (i=0; i<nC-1; i++) {
		var iBig = i;
		for (j=i+1; j<nC; j++) {
			if (SurvT[j]-Eps*Stat[j] > SurvT[iBig]-Eps*Stat[iBig]) { iBig = j }
			}
		if ( iBig!=i ) {
			v = SurvT[i]; SurvT[i] = SurvT[iBig]; SurvT[iBig] = v;
			v = Stat[i]; Stat[i] = Stat[iBig]; Stat[iBig] = v;
			for ( j=0; j<nR; j++ ) {
				v = x[ix(i,j,nR)]; x[ix(i,j,nR)] = x[ix(iBig,j,nR)]; x[ix(iBig,j,nR)] = v;
				}
			}
		}
	if ( Stat[0]>0 ) { Stat[0] = Stat[0] + 2; }
	for ( i=1; i<nC; i++ ) {
		if ( Stat[i]>0 & ( Stat[i-1]==0 | SurvT[i-1]!=SurvT[i] ) ) { Stat[i] = Stat[i] + 2 }
		}
	if ( Stat[nC-1]>0 ) { Stat[nC-1] = Stat[nC-1] + 4 }
	for ( i=nC-2; i>=0; i-- ) {
		if ( Stat[i]>0 & ( Stat[i+1]==0 | SurvT[i+1]!=SurvT[i] ) ) { Stat[i] = Stat[i] + 4 }
		}

	for (i = 0; i<nC; i++) {
		for ( j=0; j<nR; j++ ) {
			x[ix(i,j,nR)] = ( x[ix(i,j,nR)] - Av[j] ) / SD[j]
			}
		}

	//o = o + ( NL + "Iteration History..." );
	//form.output.value = o;

	for (j = 0; j<nR; j++) {
		b[j] = 0;
		}

	var LLp = 2e+30;
	var LL  = 1e+30;
	Fract = 0.0

	while( Abs(LLp-LL)>0.0001 ) {
		LLp = LL;
		LL = 0;
		var s0 = 0;
		for ( j=0; j<nR; j++ ) {
			s1[j] = 0;
			a[ix(j,nR,nR+1)] = 0;
			for ( k=0; k<nR; k++ ) {
				s2[ix(j,k,nR)] = 0;
				a[ix(j,k,nR+1)] = 0;
				}
			}
		for ( i=0; i<nC; i++ ) {
			Alpha[i] = 1;
			v = 0;
			for ( j=0; j<nR; j++ ) {
				v = v + b[j] * x[ix(i,j,nR)];
				}
			v = Exp( v );
			s0 = s0 + v;
			for ( j=0; j<nR; j++ ) {
				s1[j] = s1[j] + x[ix(i,j,nR)] * v;
				for ( k=0; k<nR; k++ ) {
					s2[ix(j,k,nR)] = s2[ix(j,k,nR)] + x[ix(i,j,nR)] * x[ix(i,k,nR)] * v;
					}
				}
			var StatI = Stat[i];
			if ( StatI==2 | StatI==3 | StatI==6 | StatI==7 ) {
				d = 0;
				for ( j=0; j<nR; j++ ) {
					s[j] = 0;
					}
				}
			if ( StatI==1 | StatI==3 | StatI==5 | StatI==7 ) {
				d = d + 1;
				for ( j=0; j<nR; j++ ) {
					s[j] = s[j] + x[ix(i,j,nR)];
					}
				}
			if ( StatI==4 | StatI==5 | StatI==6 | StatI==7 ) {
				for ( j=0; j<nR; j++ ) {
					LL = LL + s[j] * b[j];
					a[ix(j,nR,nR+1)] = a[ix(j,nR,nR+1)] + s[j] - d * s1[j] / s0;
					for (k=0; k<nR; k++ ) {
						a[ix(j,k,nR+1)] = a[ix(j,k,nR+1)] + d * ( s2[ix(j,k,nR)]/s0 - s1[j] * s1[k] / ( s0 * s0 ) );
						}
					}
				LL = LL - d * Ln( s0 );
				if ( d==1 )
					{ Alpha[i] = Power( ( 1 - v / s0 ) , ( 1 / v ) ) }
					else
					{ Alpha[i] = Exp( -d / s0 ) }
				}
			}
		LL = -2 * LL;
		//o = o + ( NL + "-2 Log Likelihood = " + Fmt( LL ) );
		if( LLp==1e+30 ) { 
		var LLn = LL; 
		//o = o + " (Null Model)" 
		}
		//form.output.value = o;

		for (i=0; i<nR; i++) { v = a[ix(i,i,nR+1)]; a[ix(i,i,nR+1)] = 1;
			for (k=0; k<nR+1; k++) { a[ix(i,k,nR+1)] = a[ix(i,k,nR+1)] / v; }
			for (j=0; j<nR; j++) {
				if (i!=j) { v = a[ix(j,i,nR+1)]; a[ix(j,i,nR+1)] = 0;
					for (k=0; k<nR+1; k++) {
						a[ix(j,k,nR+1)] = a[ix(j,k,nR+1)] - v * a[ix(i,k,nR+1)];
						}
					}
				}
			}

		Fract = Fract + 0.1; if(Fract>1) { Fract = 1 };
		for( j=0; j<nR; j++) {
			b[j] = b[j] + Fract * a[ix(j,nR,nR+1)];
			}

		}
//	o = o + " (Converged)<br>"
	var CSq = LLn - LL;
	o = o + ("<hr><strong>Overall Model Fit...</strong><br>" );
	o = o + ( NL + "Log Likelihood = " + fixed( LL/(-2) ) +"</br>");
	o = o + ("  Chi Square=" + fixed(CSq) + ";  df=" + nR + ";  p=" + fixed(ChiSq(CSq,nR)) + "<br>\n" );

	o = o + ( NL + "<br><strong>Coefficients, Std Errs, Signif, and Conf Intervs...</strong>" + NL );
	o = o + ( "<table><tr><th>   Var </th><th>       Coeff.  </th><th>  StdErr   </th><th>    p    </th><th>   Lo95%   </th><th>  Hi95% </th></tr>" + NL );
	cphmCoeff=[];
	for( j=0; j<nR; j++) {
		b[j] = b[j] / SD[j];
		SE[j] = Sqrt( a[ix(j,j,nR+1)] ) / SD[j];
		o = o + ( "<tr><td>   " + modelVarNames[j+1] + " </td><td>   " + fixed(b[j]) +"</td><td>"+ fixed(SE[j]) +"</td><td>"+ fixed( Norm(Abs(b[j]/SE[j])) ) +"</td><td>"+ fixed(b[j]-1.96*SE[j]) +"</td><td>"+ fixed(b[j]+1.96*SE[j]) +"</td></tr>\n" );
		cphmCoeff[j]=+b[j]
		}
	o+="</table>"

	o = o + ( NL + "<br><strong>Hazard Ratios and Confidence Intervs...</strong><br>" + NL );
	o = o + ( "<table><tr><th>   Var </th><th>   Hazard Ratio   </th><th>  Lo95%   </th><th>  Hi95%</th></tr>" + NL );
	for( j=0; j<nR; j++) {
		o = o + ( "<tr><td>   " + modelVarNames[j+1] + " </td><td>   " + fixed(Exp(b[j])) +"</td><td>"+ fixed(Exp(b[j]-1.96*SE[j])) +"</td><td>"+ fixed(Exp(b[j]+1.96*SE[j])) +"</td></tr>"+ NL );
		}
	o +="</table>"
	S0=[]
	S0[0]=[]
	S0[1]=[]
	S0[2]=[]
//	o = o + ( NL + "Baseline Survivor Function (at predictor means)...<br>" + NL );

	cphmMeanPower = 0
	for(var i=0; i<cphmCoeff.length; i++){
		cphmMeanPower += cphmCoeff[i]*cphmMeans[i]
	}
	cphmMeanPower = Math.exp(cphmMeanPower)

	var Sf = 1;
	for ( i=nC-1; i>=0; i-- ) {
		Sf = Sf * Alpha[i];
		if ( Alpha[i]<1 ) {
			S0[0].push(SurvT[i])
			S0[2].push(Sf)
			S0[1].push(Math.pow(Sf,1.0/cphmMeanPower))
//			o = o + ( Fmt(SurvT[i]) + Fmt(Sf) + NL );
			}
		}
		
	document.getElementById('CPHMresults').innerHTML = o;
	document.getElementById('sfMethod1').disabled=false;
}		
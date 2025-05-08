//Algorithm AS 307 

function k(m,j){
//ALGORITHM AS 307.2 APPL.STATIST. (1996),VOL.45, NO.4
//Returns the value zero if M <J; otherwise computes the
//number of combinations of J out of M	
	if(j>=0){
		if(j==1) {return m}
		if(j==2) {return m*m-1)/2}
		if(j==3) {return m*(m-1)*(m-2)/6}
	}
	return 0
}

function depth(x, y){
//ALGORITHM AS 307.1 APPL.STATIST. (1996), VOL.45, NO.4 
//Calculation of the simplicial depth and the half space depth	
//n is the number of points
//x are the x coordinates
//y are the y coordinates
	var n=x.length
	var f=array(n)
	var u,v,x=array(n), y=array(n), alpha=array(n)
	
	var gi, j, ja, jb, ki, nbad, nf, nn, nn2, nt=0, nu, numh=0, nums=0, sdep=0, hdep=0
	var alphak, angle, betak, d, eps=.000001, pi2=Math.pi*2, pi=Math.pi, xu, yu
	
	if(n<1) return
	
	//Construct the array alpha
	for(var i=0; i<n; i++){
		var d=Math.sqrt( Math.pow(x[i]-u,2) + Math.pow(y[i]-u,2))
		if(d<eps) {nt++}
		else {
			xu = (x[i]-u)/d
			yu = (y[i]-v)/d
			if(Math.abs(xu) > Math.abs(yu)){
				if(x[i] >= u){
					alpha[i-nt] = Math.asin(yu)
					if(alpha[i-nt]<0){
						alpha[i-nt] += pi2
					}
				} else {
					alpha[i-nt]=pi - Math.asin(yu)
				}
			} else {
				if(y[i]>=v){
					alpha[i-nt]=Math.acos(xu)
				} else {
					alpha[i-nt] = pi2-Math.acos(xu)
				}
			}
			if(alpha[i-nt]>= pi2-eps) alpha[i-nt]=0
		}
	} //10
	nn = n - nt
	if(nn <= 1) //Goto 60....
	
	//Sort the array alpha
	alpha.sort(function(a, b) {return a - b;});
	
	//check whether theta = (u,v) lies outside the data cloud
	angle = alpha[0] - alpha[nn-1]-pi2 
	for(var i=1; i<nn; i++){
		angle = Math.max(angle, alpha[i]-alpha[i-1])
	}
	if(angle>pi+eps) //Goto 60
	
	//Mathe samllest alpha equal to zero and compute nu=number of alpha < pi
	angle = alpha[0]
	nu=0
	for(var i=0; i<nn; i++){
		alpha[i] += -angle
		if(alpha[i] < pi-eps) nu++
	}
	if(nu >= nn) //Goto 60
	
	//Mergesort the alpha with their antipodal angles beta and
	//at the same time update i, f[i] and nbad
	
	ja=0
	jb=0
	alphak=alpha[0]
	betak=alpha[nu]-pi
	nn2=nn*2
	nbad = 0
	var i=nu
	nf = nn
	for(var j=0; j<nn2; j++){
		if(alphak + eps < betak){
			nf++
			if(ja < nn){
				ja++
				alphak=alpha[ja]
			} else {
				alphal = pi2+1
			}
		} else {
			i++
			if(i == nn+1){
				i=1
				nf= nf-nn
			}
			f[i]=nf
			nbad += k(nf-i,2)
			if(jb < nn) {
				jb++
				if(jb+nu <= nn) {
					betak = alpha[jb+nu]-pi
				} else {
					betak = alpha[jb+nu-nn] + pi
				}
			} else {
				betak = pi2+1
			} 
		}
	}

	nums = k(nn,2)-nbad 
	
	//Computation of numh for halfspace depth 
	gi=0
	ja=1
	angle = alpha[0]
	numh = Math.min(f[0], nn-f[0])
	for(i=1; i<nn; i++){
	}
}


var x=[7.32,21.41,5,41.73,45.29,18.7,62.44,14.74,98.03,69.29,11.35,45.65,92.92,36.32,67.87,3.66,65.84,33,10.15,45.82,65.54,74.43,81.44,78,32.76,45.13,0.32,38.03,21.31,7.06,17.94,73.47,63.04,32.56,9.95,80.2,90.18,63.89,42.96,52.13,73.29,20.03,88.4,77.72,9.51,89.94,16.15,16.92,41.48,63.68]
var y=[57.83,41.74,89.74,14.06,15.49,24.64,32.54,68.1,68.06,79.09,33,42.04,35.32,84.85,95.72,67.51,10,53.83,40.14,7.21,64.41,42.4,39.8,18.1,34.47,18.79,58.67,74.51,25.81,56.83,51.49,15.42,11.07,89.37,91.35,7.1,2.17,71.2,38.84,35.64,22.23,90.5,31.99,25.1,8.93,82.13,22.82,61.73,77.01,48.31]
var n=x.length
//get the depths for points 0...(n-1)

var angleTo = array(n)
var pointsOn = array(n)
for(var i=0; i<n; i++){
	angleTo[i]=array(n)
	for(var j=0; j<=i; j++){
		if(i==j || x[i]==x[j] && y[i]==y[j]){
			angleTo[i][j]=-1
			pointsOn[i]++
		} else {
			angleTo[i][j]=Math.atan2(x[j]-x[i],y[j]-y[i])
			angleTo[j][i]=Math.pi - angleTo[i][j]
		}
	}
}

depth=array(n)

for(var i=0; i<n; i++){
	//count how many points have the angleTo mod 2Pi < pi
	depth[i]=n
	for(var j=0; j<n; j++){
		if(angleTo[i][j]!=-1){	
			var angle = angleTo[i][j]
			var newDepth = 0
			for(var k=0; k<n; k++){
				if(k!=j && angleTo[i][k]!=-1 && (angleTo[i][k]-angleTo[i][j])%2*Math.pi < Math.pi){
					newDepth++
				}
			}
			newDepth = Math.min(newDepth, n-pointsOn[i]-newDepth)
		}
		depth[i]=Math.min(depth, newDepth)
	}
}
console.log(depth)

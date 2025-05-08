"use strict";

if (typeof window === 'undefined') {
	require('../src/sushi');
	require('../src/sushi_cl');
}

(function(Sushi) {
	var $M = Sushi.Matrix;
	
	if ($M.CL) {
		console.log('using device : ' + $M.CL.device_info + ' (' + $M.CL.platform_info + ')');
	}
	
	var nearlyEquals = function(a, b) {
		var tmp = a - b;
		return -0.01 < tmp && tmp < 0.01;
	};
	
	var tests = [
		{
			name : "General",
			tests : [
				{
					name : "checkEquals",
					test :function() {
						var a = new $M(3, 7);
						var b = new $M(3, 7);
						a.syncData();
						b.syncData();
						for (var i = 0; i < a.length; i++) {
							var tmp = Math.random();
							a.data[i] = tmp;
							b.data[i] = tmp;
						}
						if (a.nearlyEquals(b) !== true) {
							return false;
						}
						a.set(0, 0, -100);
						if (a.nearlyEquals(b) === true) {
							return false;
						}
						return true;
					}
				},
				{
					name : "checktoCSV",
					test :function() {
						// Default conversion from Number to String is
						// defined in ECMAScript Language Specification
						// 'ToString Applied to the Number Type'
						// Note that value is converted to Float32
						var a = $M.fromArray([
							[1.0, 0.25, 0.1],
							[-1.0, 1e21, 1e-21],
							[Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
						]);
						var csv = a.toCSV();
						var expected = '1,0.25,0.10000000149011612\r\n-1,1.0000000200408773e+21,9.999999682655225e-22\r\nNaN,Infinity,-Infinity\r\n';
						if (csv !== expected) {
							return false;
						}
						return true;
					}
				},
				{
					name : "checkfromCSV",
					test :function() {
						var csv = '1,0.25,0.10000000149011612\r\n-1,1.0000000200408773e+21,9.999999682655225e-22\r\n';
						var actual = $M.fromCSV(csv);
						var expected = $M.fromArray([
							[1.0, 0.25, 0.1],
							[-1.0, 1e21, 1e-21],
						]);
						if (!expected.equals(actual)) {
							return false;
						}
						var csv = 'NaN,Infinity,-Infinity\r\n';
						var actual = $M.fromCSV(csv);
						if (!isNaN(actual.get(0, 0))) {
							return false;
						}
						if (actual.get(0, 1) !== Number.POSITIVE_INFINITY) {
							return false;
						}
						if (actual.get(0, 2) !== Number.NEGATIVE_INFINITY) {
							return false;
						}
						return true;
					}
				},
				{
					name : "checkEye",
					test :function() {
						var eye_1 = $M.eye(10);
						var eye_2 = new $M(10, 10);
						eye_2.setEach(function(row, col) {
							return row === col ? 1 : 0
						});
						return eye_1.equals(eye_2);
					}
				},
				{
					name : "checkDiag",
					test : function() {
						var a = $M.diag([1, 2, 3]);
						var b = $M.diag((new $M(1, 3)).range());
						return a.equals($M.fromArray([
							[1, 0, 0],
							[0, 2, 0],
							[0, 0, 3]
						])) && b.equals($M.fromArray([
							[0, 0, 0],
							[0, 1, 0],
							[0, 0, 2]
						]));
					}
				},
				{
					name : "checkToRowWise",
					test :function() {
						var a = (new $M(7, 5)).t();
						a.range();
						var b = a.clone();
						a.toRowWise();
						return a.equals(b);
					}
				},
				{
					name : "checkMap",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						return a.map(function(datum) { return datum *2; }).equals(
							$M.fromArray([
								[2, 4, 6],
								[8, 10, 12]
							])
						);
					}
				},
				{
					name : "checkAdd",
					test : function() {
						var a = new $M(3, 7);
						var b = new $M(3, 7);
						a.random();
						b.random();
						var c1 = $M.add(a, b);
						for (var i = 0; i < a.length; i++) {
							if (!nearlyEquals(c1.data[i], a.data[i] + b.data[i])) {
								return false;
							}
						}
						var c2 = a.clone().add(b);
						for (var i = 0; i < a.length; i++) {
							if (!nearlyEquals(c2.data[i], a.data[i] + b.data[i])) {
								return false;
							}
						}
						return true;
					}
				},
				{
					name : "checkSub",
					test : function() {
						var a = new $M(3, 7);
						var b = new $M(3, 7);
						a.random();
						b.random();
						var c1 = $M.sub(a, b);
						for (var i = 0; i < a.length; i++) {
							if (!nearlyEquals(c1.data[i], a.data[i] - b.data[i])) {
								return false;
							}
						}
						var c2 = a.clone().sub(b);
						for (var i = 0; i < a.length; i++) {
							if (!nearlyEquals(c2.data[i], a.data[i] - b.data[i])) {
								return false;
							}
						}
						return true;
					}
				},
				{
					name : "checkTransposeAddSub",
					test : function() {
						var a = new $M(4, 6);
						a.random();
						var b = new $M(6, 4);
						b.random();
						var a_add_bt = $M.add(a, b.t());
						for (var row = 0; row < a_add_bt.rows; row++) {
							for (var col = 0; col < a_add_bt.cols; col++) {
								if (!nearlyEquals(a_add_bt.get(row, col), (a.get(row, col) + b.t().get(row, col)))) {
									return false;
								}
							}
						}
						var a_sub_bt = $M.sub(a, b.t());
						for (var row = 0; row < a_sub_bt.rows; row++) {
							for (var col = 0; col < a_sub_bt.cols; col++) {
								if (!nearlyEquals(a_sub_bt.get(row, col), (a.get(row, col) - b.t().get(row, col)))) {
									return false;
								}
							}
						}
						return true;
					}
				},
				{
					name : "checkBroadCastAdd",
					test :function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						var b = $M.fromArray([
							[1, 2, 3]
						]);
						var c = $M.fromArray([
							[1],
							[4]
						]);
						var d = $M.fromArray([
							[1, 4]
						]);
						var e = $M.fromArray([
							[1, 4],
							[2, 5],
							[3, 6]
						]);
						var f = $M.fromArray([
							[1],
							[2],
							[3]
						]);
						var g = $M.fromArray([
							[1]
						]);
						var h = $M.fromArray([
							[2],
							[3],
							[4]
						]);
						return 	$M.add(a, b).equals(
							$M.fromArray([
								[2, 4, 6],
								[5, 7, 9]
							])
						) && $M.add(a, c).equals(
							$M.fromArray([
								[2, 3, 4],
								[8, 9, 10]
							])
						) && $M.add(a, d.t()).equals(
							$M.add(a, c)
						) && $M.add(a, f.t()).equals(
							$M.add(a, b)
						) && $M.add(a.t(), d).equals(
							$M.add(e, d)
						) && $M.add(a.t(), f).equals(
							$M.add(e, f)
						) && $M.add(a.t(), b.t()).equals(
							$M.add(a, b).t()
						) && $M.add(a.t(), c.t()).equals(
							$M.add(a, c).t()
						) && $M.add(f, g).equals(h) && $M.add(b, g).equals(h.t());
					}
				},
				{
					name : "checkMulEach",
					test : function() {
						var a = new $M(3, 7);
						var b = new $M(3, 7);
						a.random();
						b.random();
						var c1 = $M.mulEach(a, b);
						for (var i = 0; i < a.length; i++) {
							if (!nearlyEquals(c1.data[i], a.data[i] * b.data[i])) {
								return false;
							}
						}
						var c2 = a.clone().mulEach(b);
						for (var i = 0; i < a.length; i++) {
							if (!nearlyEquals(c2.data[i], a.data[i] * b.data[i])) {
								return false;
							}
						}
						return true;
					}
				},
				{
					name : "checkDivEach",
					test : function() {
						var a = new $M(3, 7);
						var b = new $M(3, 7);
						a.random();
						b.random();
						var c1 = $M.divEach(a, b);
						for (var i = 0; i < a.length; i++) {
							if (!nearlyEquals(c1.data[i], a.data[i] / b.data[i])) {
								return false;
							}
						}
						var c2 = a.clone().divEach(b);
						for (var i = 0; i < a.length; i++) {
							if (!nearlyEquals(c2.data[i], a.data[i] / b.data[i])) {
								return false;
							}
						}
						return true;
					}
				},
				{
					name : "checkDot",
					test : function() {
						var a = new $M(3, 7);
						var b = new $M(3, 7);
						a.random();
						b.random();
						var c1 = $M.dot(a, b);
						var sum1 = 0.0;
						for (var i = 0; i < a.length; i++) {
							sum1 += a.data[i] * b.data[i];
						}
						if (sum1 !== c1) { return false; }
						var c2 = a.clone().dot(b);
						var sum2 = 0.0;
						for (var i = 0; i < a.length; i++) {
							sum2 += a.data[i] * b.data[i];
						}
						if (sum2 !== c2) { return false; }
						return true;
					}
				},
				{
					name : "checkMul",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						var b = $M.fromArray([
							[1, 2, 1],
							[3, 4, 0],
							[5, 6, 0]
						]);
						return 	$M.mul(a, b).equals(
							$M.fromArray([
								[22, 28, 1],
								[49, 64, 4]
							])
						)
						&&
						a.mul(b).equals(
							$M.fromArray([
								[22, 28, 1],
								[49, 64, 4]
							])
						);
					}
				},
				{
					name : "checkTimes",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						return a.times(2).equals(
							$M.fromArray([
								[2, 4, 6],
								[8, 10, 12]
							])
						);
					}
				},
				{
					name : "checkSumEachRow",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3, 4],
							[5, 6, 7, 8]
						]);
						return $M.sumEachRow(a).equals(
							$M.fromArray([
								[10],
								[26]
							])
						);
					}
				},
				{
					name : "checkSumEachCol",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3, 4],
							[5, 6, 7, 8]
						]);
						return $M.sumEachCol(a).equals(
							$M.fromArray([
								[6, 8, 10, 12]
							])
						);
					}
				},
				{
					name : "checkMaxEachRow",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3, 4],
							[5, 6, 7, 8]
						]);
						return $M.maxEachRow(a).equals(
							$M.fromArray([
								[4],
								[8]
							])
						);
					}
				},
				{
					name : "checkMaxEachCol",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3, 4],
							[5, 6, 7, 8]
						]);
						return $M.maxEachCol(a).equals(
							$M.fromArray([
								[5, 6, 7, 8]
							])
						);
					}
				},
				{
					name : "checkArgmaxEachRow",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3, 4],
							[7, 8, 5, 6]
						]);
						return $M.argmaxEachRow(a).equals(
							$M.fromArray([
								[3],
								[1]
							])
						);
					}
				},
				{
					name : "checkArgmaxEachCol",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 7, 8],
							[5, 6, 3, 4]
						]);
						return $M.argmaxEachCol(a).equals(
							$M.fromArray([
								[1, 1, 0, 0]
							])
						);
					}
				},
				{
					name : "checkArgminEachRow",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3, 4],
							[7, 8, 5, 6]
						]);
						return $M.argminEachRow(a).equals(
							$M.fromArray([
								[0],
								[2]
							])
						);
					}
				},
				{
					name : "checkArgminEachCol",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 7, 8],
							[5, 6, 3, 4]
						]);
						return $M.argminEachCol(a).equals(
							$M.fromArray([
								[0, 0, 1, 1]
							])
						);
					}
				},
				{
					name : "checkHasNaN",
					test : function() {
						var a = new $M(10, 10);
						a.random();
						var b = new $M(10, 10);
						b.random();
						b.set(5, 5, 0 / 0)
						return !$M.hasNaN(a) && $M.hasNaN(b);
					}
				},
				{
					name : "toAndFromJSON",
					test : function() {
						var a = (new $M(100, 10)).t();
						a.range();
						var json = a.toJSON();
						var b = $M.fromJSON(json);
						return a.equals(b);
					}
				},
				{
					name : "checkExtract",
					test : function() {
						var a = $M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6],
							[ 7,  8,  9],
							[10, 11, 12],
							]);
						return (
							$M.extract(a, 1, 1, 3, 1).equals($M.fromArray([[5], [8], [11]])) &&
							$M.extract(a, 2, 0, 1, 3).equals($M.fromArray([[7, 8, 9]])) &&
							$M.extract(a.t(), 1, 1, 1, 3).equals($M.fromArray([[5, 8, 11]])) &&
							$M.extract(a.t(), 0, 2, 3, 1).equals($M.fromArray([[7], [8], [9]]))
							);
					}
				},
				{
					name : "checkGetRow",
					test : function() {
						var a = $M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6],
							[ 7,  8,  9],
							[10, 11, 12],
							]);
						return (
							$M.getRow(a, 1).equals($M.fromArray([[4, 5, 6]])) &&
							$M.getRow(a, 2).equals($M.fromArray([[7, 8, 9]])) &&
							$M.getRow(a.t(), 1).equals($M.fromArray([[2, 5, 8, 11]])) &&
							$M.getRow(a.t(), 2).equals($M.fromArray([[3, 6, 9, 12]]))
							);
					}
				},
				{
					name : "checkGetCol",
					test : function() {
						var a = $M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6],
							[ 7,  8,  9],
							[10, 11, 12],
							]);
						return (
							$M.getCol(a, 1).equals($M.fromArray([[2], [5], [8], [11]])) &&
							$M.getCol(a, 2).equals($M.fromArray([[3], [6], [9], [12]])) &&
							$M.getCol(a.t(), 1).equals($M.fromArray([[4], [5], [6]])) &&
							$M.getCol(a.t(), 2).equals($M.fromArray([[7], [8], [9]]))
							);
					}
				},
				{
					name : "checkSetRow",
					test : function() {
						var a = $M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6],
							[ 7,  8,  9],
							[10, 11, 12],
							]);
						var b = $M.fromArray([[100, 200, 300]]);
						var c = $M.fromArray([[100, 200, 300, 400]]);
						return (
							a.clone().setRow(1, b).equals($M.fromArray([
								[  1,   2,   3],
								[100, 200, 300],
								[  7,   8,   9],
								[ 10,  11,  12]
							])) &&
							a.clone().t().setRow(1, c).equals($M.fromArray([
     								[  1, 100,   3],
    								[  4, 200,   6],
    								[  7, 300,   9],
    								[ 10, 400,  12]
    							]).t())
						);
					}
				},
				{
					name : "checkSetCol",
					test : function() {
						var a = $M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6],
							[ 7,  8,  9],
							[10, 11, 12],
							]);
						var b = $M.fromArray([[100, 200, 300]]);
						var c = $M.fromArray([[100, 200, 300, 400]]);
						return (
							a.clone().t().setCol(1, b.t()).equals($M.fromArray([
								[  1,   2,   3],
								[100, 200, 300],
								[  7,   8,   9],
								[ 10,  11,  12]
							]).t()) &&
							a.clone().setCol(1, c.t()).equals($M.fromArray([
     								[  1, 100,   3],
    								[  4, 200,   6],
    								[  7, 300,   9],
    								[ 10, 400,  12]
    							]))
						);
					}
				},
				{
					name : "checkVstack",
					test : function() {
						var a = $M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6]
							]);
						var b = $M.fromArray([
							[ 7,  8,  9]
						]);
						var c = $M.fromArray([
							[ 10,  13],
							[ 11,  14],
							[ 12,  15]
							]).t();
						return $M.vstack([a, b, c]).equals($M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6],
							[ 7,  8,  9],
							[10, 11, 12],
							[13, 14, 15]
						]));
					}
				},
				{
					name : "checkHstack",
					test : function() {
						var a = $M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6]
							]).t();
						var b = $M.fromArray([
							[ 7,  8,  9]
						]).t();
						var c = $M.fromArray([
							[ 10,  13],
							[ 11,  14],
							[ 12,  15]
							]);
						return $M.hstack([a, b, c]).equals($M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6],
							[ 7,  8,  9],
							[10, 11, 12],
							[13, 14, 15]
						]).t());
					}
				},
				{
					name : "checkGetEach",
					test : function() {
						var a = $M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6]
							]);
						var b = $M.fromArray([
							[0, 1, 0]
						]);
						var c = $M.fromArray([
							[1, 0]
						]);
						return $M.getEach(a, b).equals($M.fromArray([[1, 5, 3]])) &&
							$M.getEach(a.t(), c).equals($M.fromArray([[2, 4]])) &&
							$M.getEach(a, c.t()).equals($M.fromArray([[2, 4]]).t()) &&
							$M.getEach(a.t(), b.t()).equals($M.fromArray([[1, 5, 3]]).t());
					}
				},
			],
		},
		{
			name : "Large",
			tests : [
				{
					name : "checkCloneLarge",
					test : function() {
						var a = new $M(7, 9);
						a.random();
						var b = new $M(7, 9);
						b.random();
						return (
							a.largeClone().nearlyEquals(a.clone()) &&
							b.t().largeClone().nearlyEquals(b.t().clone())
							);
					}
				},
				{
					name : "checkExtractLarge",
					test : function() {
						var a = new $M.fromArray([
							[ 1,  2,  3],
							[ 4,  5,  6],
							[ 7,  8,  9],
							[10, 11, 12],
							]);
						return (
							$M.largeExtract(a, 1, 1, 3, 1).equals($M.fromArray([[5], [8], [11]])) &&
							$M.largeExtract(a, 2, 0, 1, 3).equals($M.fromArray([[7, 8, 9]])) &&
							$M.largeExtract(a.t(), 1, 1, 1, 3).equals($M.fromArray([[5, 8, 11]])) &&
							$M.largeExtract(a.t(), 0, 2, 3, 1).equals($M.fromArray([[7], [8], [9]]))
							);
					}
				},
				{
					name : "checkAddLarge",
					test : function() {
						var a = new $M(7, 9);
						a.random();
						var b = new $M(7, 9);
						b.random();
						var b2 = new $M(9, 7);
						b2.random();
						return (
							$M.largeAdd(a, b).nearlyEquals($M.add(a, b)) &&
							$M.largeAdd(a.t(), b2).nearlyEquals($M.add(a.t(), b2)) &&
							$M.largeAdd(a, b2.t()).nearlyEquals($M.add(a, b2.t())) &&
							$M.largeAdd(a.t(), b.t()).nearlyEquals($M.add(a.t(), b.t()))
							);
					}
				},
				{
					name : "checkSubLarge",
					test : function() {
						var a = new $M(7, 9);
						a.random();
						var b = new $M(7, 9);
						b.random();
						var b2 = new $M(9, 7);
						b2.random();
						return (
							$M.largeSub(a, b).nearlyEquals($M.sub(a, b)) &&
							$M.largeSub(a.t(), b2).nearlyEquals($M.sub(a.t(), b2)) &&
							$M.largeSub(a, b2.t()).nearlyEquals($M.sub(a, b2.t())) &&
							$M.largeSub(a.t(), b.t()).nearlyEquals($M.sub(a.t(), b.t()))
							);
					}
				},
				{
					name : "checkMulEachLarge",
					test : function() {
						var a = new $M(7, 9);
						a.random();
						var b = new $M(7, 9);
						b.random();
						var b2 = new $M(9, 7);
						b2.random();
						return (
							$M.largeMulEach(a, b).nearlyEquals($M.mulEach(a, b)) &&
							$M.largeMulEach(a.t(), b2).nearlyEquals($M.mulEach(a.t(), b2)) &&
							$M.largeMulEach(a, b2.t()).nearlyEquals($M.mulEach(a, b2.t())) &&
							$M.largeMulEach(a.t(), b.t()).nearlyEquals($M.mulEach(a.t(), b.t()))
							);
					}
				},
				{
					name : "checkDivEachLarge",
					test : function() {
						var a = new $M(7, 9);
						a.random();
						var b = new $M(7, 9);
						b.random();
						var b2 = new $M(9, 7);
						b2.random();
						return (
							$M.largeDivEach(a, b).nearlyEquals($M.divEach(a, b)) &&
							$M.largeDivEach(a.t(), b2).nearlyEquals($M.divEach(a.t(), b2)) &&
							$M.largeDivEach(a, b2.t()).nearlyEquals($M.divEach(a, b2.t())) &&
							$M.largeDivEach(a.t(), b.t()).nearlyEquals($M.divEach(a.t(), b.t()))
							);
					}
				},
				{
					name : "checkBroadCastAddLarge",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						var b = $M.fromArray([
							[1, 2, 3]
						]);
						var c = $M.fromArray([
							[1],
							[4]
						]);
						var d = $M.fromArray([
							[1, 4]
						]);
						var e = $M.fromArray([
							[1, 4],
							[2, 5],
							[3, 6]
						]);
						var f = $M.fromArray([
							[1],
							[2],
							[3]
						]);
						var g = $M.fromArray([
							[1]
						]);
						var h = $M.fromArray([
							[2],
							[3],
							[4]
						]);
						return 	$M.largeAdd(a, b).equals(
							$M.fromArray([
								[2, 4, 6],
								[5, 7, 9]
							])
						) && $M.largeAdd(a, c).equals(
							$M.fromArray([
								[2, 3, 4],
								[8, 9, 10]
							])
						) && $M.largeAdd(a, d.t()).equals(
							$M.add(a, c)
						) && $M.largeAdd(a, f.t()).equals(
							$M.add(a, b)
						) && $M.largeAdd(a.t(), d).equals(
							$M.add(e, d)
						) && $M.largeAdd(a.t(), f).equals(
							$M.add(e, f)
						) && $M.largeAdd(a.t(), b.t()).equals(
							$M.add(a, b).t()
						) && $M.largeAdd(a.t(), c.t()).equals(
							$M.add(a, c).t()
						) && $M.largeAdd(f, g).equals(h) && $M.largeAdd(b, g).equals(h.t());
					}
				},
				{
					name : "checkMulLarge",
					test : function() {
						var a = new $M(7, 9);
						a.random();
						var b = new $M(9, 4);
						b.random();
						var b2 = new $M(7, 4);
						b2.random();
						var b3 = new $M(4, 9);
						b3.random();
						var b4 = new $M(4, 7);
						b4.random();
						var smallok = (
							$M.largeMul(a, b).nearlyEquals($M.mul(a, b)) &&
							$M.largeMul(a.t(), b2).nearlyEquals($M.mul(a.t(), b2)) &&
							$M.largeMul(a, b3.t()).nearlyEquals($M.mul(a, b3.t())) &&
							$M.largeMul(a.t(), b4.t()).nearlyEquals($M.mul(a.t(), b4.t()))
							);
                                          if (!smallok) {
                                            return false;
                                          }
                                          var largeok = (function() {
                                            var failed = false;
                                            var check = function(rows, cols, width, row_wise_a, row_wise_b) {
                                              var x = new $M(rows, width);
                                              x.row_wise = row_wise_a;
                                              x.random();
                                              var y = new $M(width, cols);
                                              y.row_wise = row_wise_b;
                                              y.random();
                                              var gx = x.largeClone();
                                              var gy = y.largeClone();
                                              
                                              var gmul = $M.largeMul(gx, gy);
                                              var mul = $M.mul(x, y);
                                              var equals = mul.nearlyEquals(gmul);
                                              x.destruct();
                                              y.destruct();
                                              gx.destruct();
                                              gy.destruct();
                                              gmul.destruct();
                                              mul.destruct();
                                              return equals;
                                            };

                                            [1, 31, 32, 33, 127, 128, 129].forEach(function (rows) {
                                              [1, 31, 32, 33, 127, 128, 129].forEach(function (cols) {
                                                [1, 31, 32, 33, 127, 128, 129].forEach(function (width) {
                                                  [true, false].forEach(function (row_wise_a) {
                                                    [true, false].forEach(function (row_wise_b) {
                                                      if (!check(rows, cols, width, row_wise_a, row_wise_b)) {
                                                        failed = true;
                                                      }
                                                    });
                                                  });
                                                });
                                              });
                                            });
                                            return !failed;
                                          })();

                                          return largeok;
					}
				},
				{
					name : "checkTimesLarge",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						return a.largeTimes(2).nearlyEquals(
							$M.fromArray([
								[2, 4, 6],
								[8, 10, 12]
							])
						);
					}
				},
				{
					name : "checkSumEachRowLarge",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						return $M.largeSumEachRow(a).nearlyEquals(
							$M.fromArray([
								[6],
								[15]
							])
						) && $M.largeSumEachRow(a.t()).nearlyEquals(
							$M.fromArray([
								[5],
								[7],
								[9]
							])
						);
					}
				},
				{
					name : "checkSumEachColLarge",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						return $M.largeSumEachCol(a).nearlyEquals(
							$M.fromArray([
								[5, 7, 9]
							])
						) && $M.largeSumEachCol(a.t()).nearlyEquals(
							$M.fromArray([
								[6, 15]
							])
						);
					}
				},
				{
					name : "checkMaxEachRowLarge",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						return $M.largeMaxEachRow(a).nearlyEquals(
							$M.fromArray([
								[3],
								[6]
							])
						) && $M.largeMaxEachRow(a.t()).nearlyEquals(
							$M.fromArray([
								[4],
								[5],
								[6]
							])
						);
					}
				},
				{
					name : "checkMaxEachColLarge",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						return $M.largeMaxEachCol(a).nearlyEquals(
							$M.fromArray([
								[4, 5, 6]
							])
						) && $M.largeMaxEachCol(a.t()).nearlyEquals(
							$M.fromArray([
								[3, 6]
							])
						);
					}
				},
				{
					name : "checkArgmaxEachRowLarge",
					test : function() {
						var a = $M.fromArray([
							[1, 5, 3],
							[6, 2, 4]
						]);
						return $M.largeArgmaxEachRow(a).nearlyEquals(
							$M.fromArray([
								[1],
								[0]
							])
						) && $M.largeArgmaxEachRow(a.t()).nearlyEquals(
							$M.fromArray([
								[1],
								[0],
								[1]
							])
						);
					}
				},
				{
					name : "checkArgmaxEachColLarge",
					test : function() {
						var a = $M.fromArray([
							[1, 5, 3],
							[6, 2, 4]
						]);
						return $M.largeArgmaxEachCol(a).nearlyEquals(
							$M.fromArray([
								[1, 0, 1]
							])
						) && $M.largeArgmaxEachCol(a.t()).nearlyEquals(
							$M.fromArray([
								[1, 0]
							])
						);
					}
				},
				{
					name : "checkSumLarge",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6]
						]);
						return $M.largeSum(a) === 21;
					}
				},
				{
					name : "checkZerosLarge",
					test : function() {
						var a = new $M(10, 20);
						a.random();
						var b = new $M(10, 20);
						b.random();
						return a.zeros().equals(a.largeZeros()) && a.zeros(5).equals(a.largeZeros(5));
					}
				},
				{
					name : "checkMapGenerator",
					test : function() {
						if (!$M.CL) {
							return null;
						}
						var exp = $M.CL.mapGenerator('exp(a[i])');
						var a = $M.fromArray([
							[1, 2]
						]);
						var b = a.clone();
						exp(a);
						b.map(Math.exp);
						return a.nearlyEquals(b);
					}
				},
				{
					name : "checkConvolveLarge",
					test : function() {
						if (!$M.CL) {
							return null;
						}
						var a = $M.fromArray([
							[1, 2, 3],
							[4, 5, 6],
							[7, 8, 9]
						]);
						var at = $M.fromArray([
							[1, 4, 7],
							[2, 5, 8],
							[3, 6, 9]
						]);
						var b = $M.fromArray([
							[1, 2],
							[3, 4]
						]);
						var bt = $M.fromArray([
							[1, 3],
							[2, 4]
						]);
						var c = $M.fromArray([
							[ 4, 11, 18,  9],
							[18, 37, 47, 21],
							[36, 67, 77, 33],
							[14, 23, 26,  9]
						]);
						return $M.largeConvolve(a, b, 'full').equals(c) &&
						       $M.largeConvolve(at.t(), b, 'full').equals(c) &&
						       $M.largeConvolve(a, bt.t(), 'full').equals(c) &&
						       $M.largeConvolve(at.t(), bt.t(), 'full').equals(c);
					}
				},
				{
					name : "benchAddNormal",
					test : function() {
						var a = new $M(100, 2000);
						a.random();
						var b = new $M(100, 2000);
						b.random();
						var b2 = new $M(2000, 100).t();
						b2.random();
						for (var i = 0; i < 1; i++) {
							a.add(b)
							a.add(b2);
						}
						return;
					}
				},
				{
					name : "benchAddLarge",
					test : function() {
						var a = new $M(100, 2000);
						a.random();
						var b = new $M(100, 2000);
						b.random();
						var b2 = new $M(2000, 100).t();
						b2.random();
						for (var i = 0; i < 1; i++) {
							a.largeAdd(b);
							a.largeAdd(b2);
						}
						return;
					}
				},
				{
					name : "benchMulNormal",
					test : function() {
						var a = new $M(128, 768);
						a.random();
						var b = new $M(768, 100);
						b.random();
						for (var i = 0; i < 1; i++) {
							$M.mul(a, b);
						}
						return;
					}
				},
				{
					name : "benchMulLarge",
					test : function() {
						var a = new $M(128, 768);
						a.random();
						var b = new $M(768, 100);
						b.random();
						for (var i = 0; i < 1; i++) {
							$M.largeMul(a, b);
						}
						return;
					}
				},
				{
					name : "benchTimesNormal",
					test : function() {
						var a = new $M(1000, 1000);
						a.random();
						a.times(10);
						return;
					}
				},
				{
					name : "benchTimesLarge",
					test : function() {
						var a = new $M(1000, 1000);
						a.random();
						a.largeTimes(10);
						return;
					}
				},
				{
					name : "benchCloneNormal",
					test : function() {
						var a = new $M(10000, 1000);
						a.random();
						a.clone();
						return;
					}
				},
				{
					name : "benchCloneLarge",
					test : function() {
						var a = new $M(10000, 1000);
						a.random();
						a.largeClone();
						return;
					}
				},
			]
		},
		{
			name : "ForMachineLearning",
			tests : [
				{
					name : "upperTriangular",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3, 4],
							[5, 6, 7, 6],
							[1, 2, 4, 1],
							[1, 3, 5, 5]
						]);
						var b = ($M.fromArray([
							[1, 5, 1, 1],
							[2, 6, 2, 3],
							[3, 7, 4, 5],
							[4, 6, 1, 5]
						])).t();
						return $M.upperTriangular(a).equals($M.fromArray([
							[1,  2,  3,    4],
							[0, -4, -8,  -14],
							[0,  0,  1,   -3],
							[0,  0,  0, -2.5]
						])) && $M.upperTriangular(b).equals($M.fromArray([
							[1,  2,  3,    4],
							[0, -4, -8,  -14],
							[0,  0,  1,   -3],
							[0,  0,  0, -2.5]
						]));
					}
				},
				{
					name : "det",
					test : function() {
						var a = $M.fromArray([
							[1, 2, 3, 4],
							[5, 6, 7, 6],
							[1, 2, 4, 1],
							[1, 3, 5, 5]
						]);
						var b = $M.fromArray([
							[  1,  2],
							[100, 20],
						]);
						return a.det() === 10 && b.det() === -180;
					}
				},
				{
					name : "inverse",
					test : function() {
						var a = new $M(10, 10);
						a.random();
						var e = $M.eye(a.rows);
						var e_candidate_1 = a.mul(a.inverse());
						var e_candidate_2 = a.inverse().mul(a);
						return e_candidate_1.nearlyEquals(e) && e_candidate_2.nearlyEquals(e);
					}
				},
				{
					name : "qr",
					test : function() {
						var a = new $M(10, 10);
						a.random();
						var a_qr = $M.qr(a);
						var b = new $M(12, 10);
						b.random();
						var b_qr = $M.qr(b);
						var c = $M.fromArray([
							[1, 2],
							[1, 2],
							[1, 2],
						]);
						var c_qr = $M.qr(c);
						return true &&
							a_qr.Q.mul(a_qr.Q.t()).nearlyEquals($M.eye(10)) &&
							b_qr.Q.mul(b_qr.Q.t()).nearlyEquals($M.eye(12)) &&
							c_qr.Q.mul(c_qr.Q.t()).nearlyEquals($M.eye(3)) &&
							a_qr.Q.mul(a_qr.R).nearlyEquals(a) &&
							b_qr.Q.mul(b_qr.R).nearlyEquals(b) &&
							c_qr.Q.mul(c_qr.R).nearlyEquals(c);
					}
				},
				{
					name : "svd",
					test : function() {
						var a = new $M(15, 7);
						a.random();
						var usv = $M.svd(a);
						return $M.mul($M.mul(usv.U, $M.diag(usv.S)), usv.V.t()).nearlyEquals(a);
					}
				}
			]
		}
	];

	var test_each_test_case = function() {
		var idx = 0;
		var success = 0;
		var all = 0;
		var na = 0;
		return function(test, finished) {
			if (idx === test.length) {
				finished(success, all, na);
				idx = 0;
				success = 0;
				all = 0;
				na = 0;
			} else {
				var start_time = (new Date()).getTime();
				var result = false;
				console.log('-------- TEST CASE : ' + test[idx].name + ' --------');
				try {
					var result = test[idx].test();
				} catch (exception) {
				console.log('exception catched');
				console.error(exception);
				} finally {
					if (result === void 0) {
						console.log('benchmark');
					} else if (result === null) {
						console.log('N/A')
					} else {
						console.log(result);
					}
					console.log('elapsed time : ' + ((new Date()).getTime() - start_time) + ' ms');
					if (result === true) {
						success++;
					} else if (result === null) {
						na++;
					}
					if (result === true || result === false) {
						all++;
					}
				};
				idx++;
				setTimeout(test_each_test_case.bind(false, test, finished), 0);
			}
		};
	}();

	var test_each_test = function() {
		var idx = 0;
		var success = 0;
		var all = 0;
		var na = 0;
		var results_statistics = {};
		return function() {
			if (idx === tests.length) {
				console.log();
				console.log('=====================================');
				Object.keys(results_statistics).forEach(function (test_name) {
					console.log(test_name + ' : ' + results_statistics[test_name].success + ' / ' + results_statistics[test_name].all + ' test cases succeeded. (N/A : ' + results_statistics[test_name].na + ' )');
				});
				console.log('=====================================');
				console.log('TOTAL : ' + success + ' / ' + all + ' test cases succeeded. (N/A : ' + na + ')');
				console.log();
			} else {
				console.log('################ TEST : ' + tests[idx].name + ' ########################');
				setTimeout(
					test_each_test_case.bind(false, tests[idx].tests, function(local_success, local_all, local_na) {
						results_statistics[tests[idx].name] = { success : local_success, all : local_all, na : local_na };
						success += local_success;
						all += local_all;
						na += local_na;
						idx++;
						test_each_test();
					}),
					0
				);
			}
		};
	}();
	
	var start_tests = function(tests) {
		console.log('==================== start tests ====================');
		test_each_test();
	};

	start_tests(tests);
})(Sushi);

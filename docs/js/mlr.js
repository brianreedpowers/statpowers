			function interactionInModel(v1, v2){
				var var1 = Math.min(v1,v2)
				var var2 = Math.max(v1,v2)
				if(var1 == var2) return false;
				return (exists("int_"+var2+"."+var1) && document.getElementById("int_"+var2+"."+var1).checked)
			}


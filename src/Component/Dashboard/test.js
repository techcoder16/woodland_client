
//atm 
function atm(val) {
//25000
    let val2 = val;
        let obj = [5000,1000,500]
    
        let i = 0;
        let arr = [0,0,0];

        obj.map((e,index)=>{
                if (e  <= val2)
            {
                    if ((val2/obj[index]) > 0 )
                    {
                arr[index] =  Math.floor((val2/obj[index]));
                 val2 = val2 - (obj[index]*arr[index]);


                }
                    //val2 = val2 - ();


            }
                
      
            
        });

        console.log(arr);

}

atm(2500)

atm(12500)

atm(6000)

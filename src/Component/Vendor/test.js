var cal = function (ops)
{
    var result = null;
    var sum = [];
    for (var i = 0; i < ops.length; i++)
    {
        var op = ops[i];
        console.log(op);
        const regex = RegExp('^-?\\d+(\\.\\d+)?$'); // Note the use of double backslashes

      

        if (regex.test(op)==true) 
        {
            
            console.log(op)
            sum.push(parseInt(op));
        }
        else if (op == '+')
        {
            sum.push(sum[sum.length - 1] + sum[sum.length -2]);
        }
        else if (op == 'D')
        {
            sum.push(sum[sum.length -1]*2)
        }
        else if (op == 'C')
        {
            sum.pop();
        }
    }
console.log(sum);
}
console.log(cal(['5','2','C','D','+']))


export default function convertToBase64(file:any)
{
    return new Promise(function(resolve, reject) {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = ()=>{
        resolve(fileReader.result);
    };

    fileReader.onerror = (error)=>{
        reject(error);
    }
    });

}
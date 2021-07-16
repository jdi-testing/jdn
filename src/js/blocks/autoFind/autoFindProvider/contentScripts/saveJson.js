export const saveJson = (content) => {
    var a = document.createElement("a");
    var file = new Blob([content], {type: 'text/plain'});
    a.href = URL.createObjectURL(file);
    a.download = 'json.txt';
    a.click();
}
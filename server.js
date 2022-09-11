const express = require('express');
var SneaksAPI = require('sneaks-api');
var fs = require('fs');
var zip = require('express-zip');
var http = require('http');
var xlsx = require('xlsx');
var formidable = require('formidable');

const app = express()
app.set('view engine', 'ejs');

const { url } = require('inspector');

var sneaks = new SneaksAPI();

global.current = 0;
global.total = 0;
global.success = 0;
global.error = 0;
global.sItems = new Set();
global.eItems = new Set();






function appendFileC(csvF) {
    global.current += 1;
    global.success += 1;
    console.log("--------------------------", global.current, global.total);

    if (global.sItems.has(csvF)) {
        console.log("duplicate")

    } else {
        global.sItems.add(csvF);
        fs.appendFile('output.csv', csvF, function(err) {
            if (err) throw err;
            console.log('Saved!');

        });
    }

}

function sneaker(size, sneakerId, price, barcode, callback) {
    sneaks.getProductPrices(sneakerId, function(err, product) {
        csv = "";

        // console.log(product);
        if (err) {
            global.current += 1;
            global.error += 1;
            if (global.eItems.has(sneakerId)) {
                console.log("duplicate");
                // console.log(err);
                return;
            } else {
                fs.appendFile('error.csv', sneakerId + "," + err + "\n", function(err) {
                    if (err) throw err;
                    console.log('Saved!');
                    // console.log(err);
                });
                global.eItems.add(sneakerId);
            }

        } else {
            var desc = String(product["description"]);
            var des = "";
            for (var i = 0; i < desc.length; i++) {
                var d = desc[i];
                if (d != "\"") {
                    des += d;

                } else {
                    des += "'";
                }
            }
            csv += product["urlKey"] + ",";
            csv += "\"" + product["shoeName"] + "\"" + ",";
            csv += "\"" + des + "\"" + ",";
            csv += "\"" + product["brand"] + "\"" + ",";
            csv += ",Shoes,,";
            csv += "TRUE,Size,";
            csv += size[0][0] + ",";
            csv += ",,";
            csv += ",,";
            csv += "\"" + String(barcode) + "\"" + ",";
            csv += "0,shopify,";
            csv += size[0][1] + ",";
            csv += "deny,manual,";
            csv += price + ",";
            csv += ",TRUE,TRUE,,";
            csv += "\"" + product["thumbnail"] + "\",";
            csv += ",1,,";
            csv += "\"" + product["shoeName"] + "\"" + ",";
            csv += ",,,,,,,,,,,,,,,,lb,,active";
            csv += "\n";
            var sizeL = size.length;
            var images = product["imageLinks"].length;
            var ln = Math.max(sizeL, images);

            for (var i = 0; i < ln; i++) {
                var option = "";
                var quant = "";
                var _images = "";

                if (i + 1 < sizeL) {
                    option = size[i + 1][0];
                    quant = size[i + 1][1];
                }

                if (i < images) {
                    _images = product["imageLinks"][i];
                }
                if (option != quant != _images) {
                    if (i + 1 < sizeL) {

                        csv += product["urlKey"] + ",";
                        csv += `,,,,,,,,${option},,,,,${barcode},0,shopify,${quant},deny,manual,${price},,TRUE,TRUE,,${_images},,,,,,,,,,,,,,,,,,,,lb,lb,,`;
                        csv += "\n";
                    } else {
                        csv += product["urlKey"] + ",";
                        csv += ",,,,,,,,,,,,,,,,,,,,,,,,";
                        csv += _images;
                        csv += ",,,,,,,,,,,,,,,,,,,,,,,";
                        csv += "\n";
                    }
                }
            }
            // for (var i = 0; i < product["imageLinks"].length; i++) {
            //     csv += product["urlKey"] + ",";
            //     csv += ",,,,,,,,,,,,,,,,,,,,,,,,";
            //     csv += product["imageLinks"][i];

            //     csv += ",,,,,,,,,,,,,,,,,,,,,,,";
            //     csv += "\n";
            // }


            console.log(csv);

            callback(csv);

        }
    });
}

//drop those first two rows which are empty

// console.log(data.length);
// console.log(headers);

function getData() {
    var obj = xlsx.readFile(__dirname + '/fileupload/1.xlsx'); // parses a file
    var sheet_name_list = obj.SheetNames;
    console.log(sheet_name_list);
    var allHeaders = [];

    var allData = [];
    for (sheet in sheet_name_list) {
        var worksheet = obj.Sheets[sheet_name_list[sheet]];
        var header = {};
        var data = [];
        for (z in worksheet) {
            if (z[0] === '!') continue;
            //parse out the column, row, and value
            var tt = 0;
            for (var i = 0; i < z.length; i++) {
                if (!isNaN(z[i])) {
                    tt = i;
                    break;
                }
            };
            var col = z.substring(0, tt);
            var row = parseInt(z.substring(tt));
            var value = worksheet[z].v;

            //store header names
            if (row == 1 && value) {
                header[col] = value;
                continue;
            }

            if (!data[row]) data[row] = {};
            data[row][header[col]] = value;
        }
        allHeaders.push(header);
        data.shift();
        data.shift();
        allData.push(data);
    }
    // console.log(data[205] == undefined);
    // console.log(headers);
    var js = {};
    var error = [];
    var valid = 0;
    for (var _ = 0; _ < allData.length; _++) {
        var data = allData[_];
        headers = allHeaders[_];
        var name = headers.B.split(" ")[2];
        // console.log(name);
        // console.log(headers);
        // break;
        for (i = 0; i < allData[_].length; i++) {
            item = {};

            if (data[i]) {
                try {
                    if (js[data[i][headers.E]] != undefined) {
                        if (js[data[i][headers.E]][headers.B] == undefined) {
                            js[data[i][headers.E]][headers.B] = data[i][headers.B] == undefined ? [] : [data[i][headers.B]];
                            temp = {};
                            temp[data[i][headers.B]] = 1;
                            js[data[i][headers.E]][name] = temp;
                        } else {
                            if (!js[data[i][headers.E]][headers.B].includes(data[i][headers.B])) {
                                // console.log("Here Too");

                                js[data[i][headers.E]][headers.B].push(data[i][headers.B]);
                                js[data[i][headers.E]][name][data[i][headers.B]] = 1;
                            } else {
                                // console.log("How about Here Too");
                                js[data[i][headers.E]][name][data[i][headers.B]]++;
                                // console.log(js[data[i][headers.E]]);

                            }
                        }


                    } else {
                        if (data[i][headers.E] != undefined) {
                            item[headers.A] = data[i][headers.A] == undefined ? "" : data[i][headers.A];
                            item[headers.B] = data[i][headers.B] == undefined ? [] : [data[i][headers.B]];
                            item[headers.C] = data[i][headers.C] == undefined ? "" : data[i][headers.C];
                            if (data[i][headers.D] != undefined) {
                                var barcode = String(data[i][headers.D]);
                                var ascii = barcode.charCodeAt(0);
                                if (ascii <= 57 && ascii >= 40) {
                                    item[headers.D] = "'" + String(data[i][headers.D]) + "'";
                                } else {
                                    item[headers.D] = String(data[i][headers.E]);

                                }

                            } else {
                                item[headers.D] = String(data[i][headers.E]);

                            }
                            item[headers.E] = data[i][headers.E] == undefined ? "" : String(data[i][headers.E]);
                            item[headers.F] = data[i][headers.F] == undefined ? "" : data[i][headers.F];
                            temp = {};
                            temp2 = {};
                            if (data[i][headers.B] != undefined) {
                                temp[data[i][headers.B]] = 1;
                            }

                            item[name] = temp;
                            // item['sizeOptions'] = [];
                            // js[data[i].headers.B]=item
                            js[data[i][headers.E]] = item;

                            valid++;
                        } else {
                            error.push(data[i][headers.A]);
                        }
                    }
                } catch (Exception) {
                    console.log(Exception);

                }

            }
            // console.log(item);
        }
        // break;
    }
    // console.log(js)
    // var keys = [];
    var keys = Object.keys(js);
    for (var _ = 0; _ < allData.length; _++) {
        var data = allData[_];
        headers = allHeaders[_];
        var name = headers.B.split(" ")[2];
        console.log(name);
        console.log(headers);
        // break;
    }




    for (var i = 0; i < keys.length; i++) {
        var sizes = [];
        var object = js[keys[i]];
        var id = object[headers.F];
        var flag = false;
        console.log(object);
        for (_ = 0; _ < allHeaders.length; _++) {
            headers = allHeaders[_];
            var name = headers.B.split(" ")[2];
            if (object[headers.B] != undefined) {
                for (var x = 0; x < object[headers.B].length; x++) {
                    temp = [`${name} - ${object[headers.B][x]}`, object[name][object[headers.B][x]]];
                    sizes.push(temp);
                }

            }

        }
        object['sizeOptions'] = sizes;




    }
    // //////////////////////////////
    global.total = data.length;
    global.success = 0;
    global.current = 0;
    global.error = 0;
    Object.keys(js).forEach(async(sneakId) => {
        try {
            var obj = js[sneakId];
            sneakerName = obj[headers.A];
            menSize = obj[headers.B];
            // womenSize = obj[headers.C];
            price = obj[headers.C];
            barcode = obj[headers.D];
            sneakerId = obj[headers.E];
            size = obj.sizeOptions;
            if (sneakerId.length >= 8) {
                var temp = "";
                if (sneakerId.indexOf("-") == -1) {
                    for (var _ = 0; _ < sneakerId.length; _++) {
                        if (_ == 6) {
                            temp += "-";

                        }
                        temp += sneakerId[_];
                    }
                }
                sneakerId = temp;
            }
            sneaker(size, sneakerId, price, barcode, (file) => {
                appendFileC(file);
            });

        } catch (Exception) {
            global.current += 1;
            global.error += 1;
            if (global.eItems.has(sneakerId)) {
                console.log("duplicate");

            } else {
                fs.appendFile('error.csv', sneakerId + "," + Exception + "\n", function(err) {
                    if (err) throw err;
                    console.log('Saved!');
                });
                global.eItems.add(obj[headers['A']]);
            }
            // console.log(Exception);
        }
    });




}


app.get('/', (req, res) => {

    res.render("index");

});

app.post('/fileupload', (req, res) => {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var oldpath = files.filetoupload.filepath;
        var mx = 0;

        max = String(mx + 1);
        var str = (files.filetoupload.originalFilename).split(".");
        var newpath = './fileupload/' + "1." + str[str.length - 1];
        // console.log(str);

        fs.rename(oldpath, newpath, function(err) {
            if (err) throw err;
            res.render("fileupload");


        });
    });

});
app.post('/getdata', (req, res) => {
    global.sItems = new Set();
    global.eItems = new Set();
    fs.writeFile('output.csv', 'Handle,Title,Body (HTML),Vendor,Standard Product Type,Custom Product Type,Tags,Published,Option1 Name,Option1 Value,Option2 Name,Option2 Value,Option3 Name,Option3 Value,Variant SKU,Variant Grams,Variant Inventory Tracker,Variant Inventory Qty,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Variant Barcode,Image Src,Image Position,Image Alt Text,Gift Card,SEO Title,SEO Description,Google Shopping / Google Product Category,Google Shopping / Gender,Google Shopping / Age Group,Google Shopping / MPN,Google Shopping / AdWords Grouping,Google Shopping / AdWords Labels,Google Shopping / Condition,Google Shopping / Custom Product,Google Shopping / Custom Label 0,Google Shopping / Custom Label 1,Google Shopping / Custom Label 2,Google Shopping / Custom Label 3,Google Shopping / Custom Label 4,Variant Image,Variant Weight Unit,Variant Tax Code,Cost per item,Status\n', function(err) {
        if (err) throw err;
        console.log('Saved!');
    });
    fs.writeFile('error.csv', 'sneakerId,reason\n', function(err) {
        if (err) throw err;
        console.log('Saved!');
    });

    getData();
    var files = [{ path: "./output.csv", name: "output.csv" }, { path: "./error.csv", name: "error.csv" }]
    setTimeout(() => {
        res.zip(files);

        // }, 20000);
    }, 180000);
});


app.get('/download', (req, res) => {
    var files = [{ path: "./output.csv", name: "output.csv" }, { path: "./error.csv", name: "error.csv" }]
    res.zip(files);

});
app.listen(3000);
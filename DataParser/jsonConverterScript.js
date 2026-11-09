const xlsx = require('xlsx')
const util = require('util');
const fs = require('fs');
const readdir = util.promisify(fs.readdir);

const xlsxDirPath = './table/';
const jsonDirPath = './json/';
const tableHeadRow = 1;

let fsDir = async function () {
    try {
        // 根据路径读取文件
        let xlsxArr = await readdir(xlsxDirPath);
        xlsxArr.forEach(fileName => {
            // 如果是xlsx文件则进行文件读取
            if (fileName.split('.')[1] == 'xlsx') {
                const workbook = xlsx.readFile(xlsxDirPath + fileName);
                readXlsx(workbook);
            }
        })
    } catch (err) {
        console.error('error', err);
    }
}
fsDir();

let readXlsx = function (workbook) {
    const enableTable = workbook.Sheets['Enable'];
    const enableArr = xlsx.utils.sheet_to_json(enableTable);

    enableArr.forEach(sheet => {
        const worksheet = workbook.Sheets[sheet.name];
        // 获取第二行的值作为键和数据类型
        let headers = [];
        let types = [];
        for (let cell in worksheet) {
            const cellDetails = xlsx.utils.decode_cell(cell);
            if (cellDetails.r === tableHeadRow) {
                const header = worksheet[cell].v.split(':');
                headers[cellDetails.c] = header[0];
                if (header.length == 2) {
                    types[cellDetails.c] = header[1];
                } else {
                    types[cellDetails.c] = '';
                }
            }
        }
        if (worksheet) {
            const jsonData = xlsx.utils.sheet_to_json(worksheet, {
                header: headers,
                range: 2,
                defval: null,
                raw: true,
            }).filter((data, index) => headers[index] !== '');

            types = types.filter((type, index) => headers[index] !== '');
            headers = headers.filter(header => header !== '');

            // 格式转换
            jsonData.forEach(data => {
                headers.forEach((header, index) => {
                    switch (types[index]) {
                        case 'i':
                            data[header] = parseInt(data[header]);
                            break;
                        case 'f':
                            data[header] = parseFloat(data[header]);
                            break;
                        case 's':
                            data[header] = `${data[header]}`;
                            break;
                        case 'b':
                            data[header] = Boolean(JSON.parse(data[header]));
                            break;
                        case 'ai':
                            data[header] = JSON.parse(data[header]).map(Number);
                            data[header].forEach(d => parseInt(d));
                            break;
                        case 'af':
                            data[header] = JSON.parse(data[header]).map(Number);
                            break;
                        case 'as':
                            data[header] = JSON.parse(data[header]);
                            break;
                        case 'av':
                            data[header] = JSON.parse(data[header]).map(coordArray => {
                                const [x, y, z] = coordArray;
                                return { x, y, z };
                            });
                            break;
                        default:
                            break;
                    }
                })
            })

            writeJson(jsonData, sheet.name)
            console.log(jsonData);
        } else {
            console.error(sheet.name + ' 表格不存在');
        }
    })
}

let writeJson = function (jsonData, jsonName) {
    // 将数据转换为 JSON 字符串
    const json = JSON.stringify(jsonData, null, 2); // 使用缩进和换行符增加可读性

    // 指定要保存的文件路径
    const filePath = jsonDirPath + jsonName + '.json';

    // 将 JSON 字符串写入文件
    fs.writeFile(filePath, json, (err) => {
        if (err) {
            console.error('写入文件时出错：', err);
        } else {
            console.log('JSON 文件已成功保存到：', filePath);
        }
    });
}
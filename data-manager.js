var _Path = require('path');
var _FileSystem = require('./../Song_Repository_Server/src/file-system');


var CollectionRoot = __dirname + '/data/collection/';
var IndexRoot = __dirname + '/data/index/';


var RegisterManager = function () {
    var self = this;
    setInterval(function () {
        self.autoBuildRegister();
    }, 5 * 60 * 1000);
    return self;
};
RegisterManager.prototype.getFileBaseName = function (fileName) {
    return _Path.basename(fileName, _Path.extname(fileName));
};
RegisterManager.prototype.getCollectionName = function (jsonObj) {
    return jsonObj['name'];
};
RegisterManager.prototype.getCollectionCover = function (jsonObj) {
    return jsonObj['cover'];
};
RegisterManager.prototype.isCollectionFile = function (fileName) {
    const JSON = '.json';
    return _Path.extname(fileName) === JSON;
};
RegisterManager.prototype.buildCollectionItem = function (fileBaseName, name, cover) {
    var item = {
        file_name: fileBaseName,
        name: name,
        cover: cover
    };
    return item;
};
RegisterManager.prototype.readCollectionFileList = function () {
    return _FileSystem.readDir(CollectionRoot);
};
RegisterManager.prototype.readCollectionFile = function (fileName) {
    var filePath = _Path.join(CollectionRoot, fileName);
    return _FileSystem.readJsonFile(filePath);
};
RegisterManager.prototype.saveRegister = function (register) {
    var registerFileName = 'register.json';
    var filePath = _Path.join(IndexRoot, registerFileName);
    _FileSystem.saveObjToFile(register, filePath);
};
RegisterManager.prototype.buildRegister = function (fileList) {
    var self = this;
    var result = [];
    try {
        fileList.forEach(function (fileName) {
            if (self.isCollectionFile(fileName)) {
                var fileBaseName = self.getFileBaseName(fileName);
                var jsonObj = self.readCollectionFile(fileName);
                var name = self.getCollectionName(jsonObj);
                var cover = self.getCollectionCover(jsonObj);
                var item = self.buildCollectionItem(fileBaseName, name, cover);
                result.push(item);
            }
        });
    } catch (err) {
        console.error(err);
        return null;
    }
    return result;
};
RegisterManager.prototype.autoBuildRegister = function () {
    var self = this;
    var fileList = self.readCollectionFileList();
    var register = self.buildRegister(fileList);
    if (register) {
        self.saveRegister(register);
    } else {
        console.error('RegisterManager.autoBuildRegister() is failed.');
    }
};


var DataManager = function () {
    var self = this;

    self._RegisterManager = new RegisterManager();
    setTimeout(function () {
        self._RegisterManager.autoBuildRegister();
    }, 1);

    return self;
};


var dataManager = new DataManager();

module.exports = exports = dataManager;
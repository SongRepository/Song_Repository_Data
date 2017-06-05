var _Path = require('path');
var _FileSystem = require('./../Song_Repository_Server/src/file-system');


var CollectionRoot = __dirname + '/data/collection/';
var IndexRoot = __dirname + '/data/index/';

const TIME = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000
};

function RegisterManager() {
    const self = this;

    self.registerObj = [];
    self._BucketFileName = 'bucket.json';
    self.bucket = null;
    self.isBucketWork = true;
    self._CollectionFileNameList = null;

    setInterval(function () {
        self._saveBucket();
        self.saveRegister();
    }, 30 * TIME.minute);
    setInterval(function () {
        self.autoBuildRegister();
    }, 5 * TIME.minute);
    setTimeout(function () {
        self._readBucket();
        self.autoBuildRegister();
    }, TIME.second);
}
RegisterManager.prototype._readBucket = function () {
    const filePath = _Path.join(IndexRoot, this._BucketFileName);
    if (_FileSystem.existsSync(filePath)) {
        const json = _FileSystem.readJsonFile(filePath);
        this.bucket = Bucket.parse(json);
    }
};
RegisterManager.prototype._saveBucket = function () {
    const filePath = _Path.join(IndexRoot, this._BucketFileName);
    const jsonObj = this.bucket.toJSON_Obj();
    _FileSystem.saveObjToFile(jsonObj, filePath);
};
RegisterManager.prototype._sort = function (fileList, isAscending, isCopy) {
    const self = this;
    const countSet = {};
    const result = isCopy ? fileList.slice(0) : fileList;

    result.sort(function (a, b) {
        const a_BaseFileName = self.getFileBaseName(a);
        const b_BaseFileName = self.getFileBaseName(b);
        var sortResult = 0;
        var a_count = countSet[a_BaseFileName];
        var b_count = countSet[b_BaseFileName];
        if (!a_count) {
            a_count = self.bucket.countSimple(a_BaseFileName);
        }
        if (!b_count) {
            b_count = self.bucket.countSimple(b_BaseFileName);
        }
        if (isAscending) {
            sortResult = b_count - a_count;
        } else {
            sortResult = a_count - b_count;
        }
        if (sortResult === 0) {
            sortResult = a_BaseFileName.localeCompare(b_BaseFileName);
        }
        return sortResult;
    });

    return result;
};
RegisterManager.prototype._hasFileName = function (fileName) {
    const self = this;
    const notInit = !self._CollectionFileNameList;
    if (notInit) {
        self._CollectionFileNameList = {};
        const fileList = self.readCollectionFileList();
        fileList.forEach(function (fileName_ext) {
            const baseFileName = self.getFileBaseName(fileName_ext);
            self._CollectionFileNameList[baseFileName] = fileName_ext;
        });
    }

    return self._CollectionFileNameList[fileName];
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
        fileName: fileBaseName,
        name: name,
        cover: cover
    };
    return item;
};
RegisterManager.prototype.readCollectionFileList = function () {
    const self = this;
    const result = [];
    const fileList = _FileSystem.readDir(CollectionRoot);
    fileList.forEach(function (fileName_ext) {
        if (self.isCollectionFile(fileName_ext)) {
            result.push(fileName_ext);
        }
    });
    return result;
};
RegisterManager.prototype.readCollectionFile = function (fileName) {
    var filePath = _Path.join(CollectionRoot, fileName);
    return _FileSystem.readJsonFile(filePath);
};
RegisterManager.prototype._saveRegister = function (register) {
    var registerFileName = 'register.json';
    var filePath = _Path.join(IndexRoot, registerFileName);
    _FileSystem.saveObjToFile(register, filePath);
};
RegisterManager.prototype.saveRegister = function () {
    const register = this.registerObj;
    if (register) {
        this._saveRegister(register);
    } else {
        console.error('RegisterManager.autoBuildRegister() is failed.');
    }
};
RegisterManager.prototype.buildRegister = function (fileList) {
    var self = this;
    var result = [];
    try {
        fileList.forEach(function (fileName) {
            var fileBaseName = self.getFileBaseName(fileName);
            var jsonObj = self.readCollectionFile(fileName);
            var name = self.getCollectionName(jsonObj);
            var cover = self.getCollectionCover(jsonObj);
            var item = self.buildCollectionItem(fileBaseName, name, cover);
            result.push(item);
        });
    } catch (err) {
        console.error(err);
        return null;
    }
    return result;
};
RegisterManager.prototype.autoBuildRegister = function () {
    const self = this;
    var fileList = self.readCollectionFileList();
    if (self.isBucketWork) {
        fileList = self._sort(fileList, true);
    }
    self.registerObj = self.buildRegister(fileList);
};
RegisterManager.prototype.collect = function (fileName) {
    if (this._hasFileName(fileName)) {
        this.bucket.add(fileName);
        return this.bucket.count(fileName);
    } else {
        return {'fileName': fileName, 'error': 'no has fileName'}
    }
};
RegisterManager.prototype.getRegisterObj = function () {
    return this.registerObj;
};

function Bucket(data, maxHour) {
    const self = this;

    self.maxHour = maxHour || 24;
    self._autoClearTime = TIME.hour;

    self._data = data || [{}];
    self._ADD_INTERVAL = TIME.minute;
    self._lastAddFileName = null;
    self._lastAddTime = 0;

    self._autoClear();
}
Bucket.prototype._len = function () {
    return this._data.length;
};
Bucket.prototype._pop = function () {
    if (this._len() >= this.maxHour) {
        this._data.pop();
    }
    this._data.splice(0, 0, {});
};
Bucket.prototype._get = function (hour, fileName) {
    var count = this._data[hour][fileName];
    if (count === undefined || count === null) {
        count = 0;
    }
    return count;
};
Bucket.prototype._set = function (hour, fileName, count) {
    this._data[hour][fileName] = count;
};
Bucket.prototype._lastHourIndex = function () {
    return 0;
};
Bucket.prototype._autoClear = function () {
    const self = this;
    setInterval(function () {
        self._pop();
    }, self._autoClearTime);
};
Bucket.prototype.add = function (fileName) {
    const self = this;
    const now = Date.now();
    const greaterInterval = (now - self._lastAddTime) > self._ADD_INTERVAL;
    const notLastAddFileName = fileName !== self._lastAddFileName;
    if (greaterInterval || notLastAddFileName) {

        const lastHour = self._lastHourIndex();
        const count = self._get(lastHour, fileName);
        self._set(lastHour, fileName, count + 1);

        self._lastAddTime = now;
        self._lastAddFileName = fileName;
    }
};
Bucket.prototype.count = function (fileName) {
    const self = this;
    const result = {
        'fileName': fileName,
        'count': 0,
        'timeUnit': 'hour',
        'maxLength': self.maxHour,
        'latest': {}
    };
    for (var i = 0; i < self._len(); i++) {
        const hourCount = self._get(i, fileName);
        const key = i + 1;
        result.count += hourCount;
        result.latest[key] = hourCount;
    }
    return result;
};
Bucket.prototype.countSimple = function (fileName) {
    return this.count(fileName).count;
};
Bucket.prototype.toJSON_Obj = function () {
    const self = this;
    const json = {
        'maxHour': self.maxHour,
        'data': self._data
    };
    return json;
};
Bucket.parse = function (jsonString) {
    var result = null;
    try {
        var json = jsonString;
        if (typeof(jsonString ) === 'string') {
            json = JSON.parse(jsonString);
        }
        if (json) {
            const data = json.data;
            const maxHour = parseInt(json.maxHour);
            result = new Bucket(data, maxHour);
        }
    }
    catch (e) {
        console.error(e);
    }
    if (result) {
        return result;
    } else {
        return new Bucket();
    }
};


function DataManager() {
    var self = this;
    self._RegisterManager = new RegisterManager();

    self.collect = function (fileName, response) {
        var result = self._RegisterManager.collect(fileName);
        response.status(200);
        response.end(JSON.stringify(result));
    };
    self.registerModel = function (response) {
        const result = self._RegisterManager.getRegisterObj();
        response.status(200);
        response.end(JSON.stringify(result));
    };
}


var dataManager = new DataManager();

module.exports = exports = dataManager;
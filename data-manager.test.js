var _DataManager = require('./data-manager');
var _Assert = require("assert");

var _RegisterManager = _DataManager._RegisterManager;

describe("RegisterManager", function () {

    describe('getFileBaseName', function () {
        it('', function () {
            var fileName = 'aaabbb.json';
            var fileName2 = 'aaa/bbb/ccc.exe';

            var result = _RegisterManager.getFileBaseName(fileName);
            var result2 = _RegisterManager.getFileBaseName(fileName2);

            _Assert.equal(result, 'aaabbb');
            _Assert.equal(result2, 'ccc');
        });
    });

    describe('getCollectionName', function () {
        it('', function () {
            var jsonObj = {
                name: 'name'
            };

            var result = _RegisterManager.getCollectionName(jsonObj);

            _Assert.equal(result, 'name');
        });
    });

    describe('getCollectionCover', function () {
        it('', function () {
            var jsonObj = {
                name: 'name',
                cover: 'cover'
            };

            var result = _RegisterManager.getCollectionCover(jsonObj);

            _Assert.equal(result, 'cover');
        });
    });

    describe('isCollectionFile', function () {
        it('', function () {
            var fileName = 'aaabbb.json';
            var fileName2 = 'adddd.js';

            var result = _RegisterManager.isCollectionFile(fileName);
            var result2 = _RegisterManager.isCollectionFile(fileName2);

            _Assert.equal(result, true);
            _Assert.equal(result2, false);

        });
    });

    describe('buildCollectionItem', function () {
        it('', function () {
            var fileBaseName = 'honey-and-clover';
            var name = '蜂蜜与四叶草';
            var cover = 'cover.jpg';

            var result = _RegisterManager.buildCollectionItem(fileBaseName, name, cover);

            _Assert.equal(result['file_name'], fileBaseName);
            _Assert.equal(result['name'], name);
            _Assert.equal(result['cover'], cover);
        });
    });

    describe('buildRegister', function () {
        it('', function () {

            var fileList = _RegisterManager.readCollectionFileList();
            var result = _RegisterManager.buildRegister(fileList);

            //_Assert.equal(result, {});
        });
    });
});
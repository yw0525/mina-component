"use strict";
/**
 * @file ProTable - 竖屏
 * @module ProTable/portrait
 */
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("../../common/component");
var tool_1 = require("../shared/tool");
(0, component_1.MinaComponent)({
    props: {
        /**
         * @property {Number} mr - margin right
         * @property {Number} rowH - row height
         */
        mr: {
            type: Number,
            value: 0
        },
        rowH: {
            type: Number,
            value: 45
        },
        /**
         * @property {Array} columns - 列配置
         * @property {Array} dataSource - 数据
         */
        columns: {
            type: Array,
            value: []
        },
        dataSource: {
            type: Array,
            value: [],
            observer: function () {
                this.init();
            }
        },
        /**
         * @property {String} sortField - 排序字段
         * @property {String} sortType - 排序类型 desc、asc
         */
        sortField: {
            type: String,
            value: ''
        },
        sortType: {
            type: String,
            value: 'desc'
        },
        /**
         * @property {Object} order - 排序相关配置
         * @property {Boolean} order.enabled - 启用排序
         * @property {Boolean} order.styleEnabled - 启用排序样式
         * @property {Boolean} order.next - 是否存在下一级
         */
        order: {
            type: Object,
            value: {}
        }
    },
    data: {
        /**
         * @property {Number} height - 表格高度
         */
        height: 0,
        /**
         * @property {Array} leftColumns - 左侧固定列
         * @property {Array} middleColumns - 正常列
         */
        leftColumns: [],
        middleColumns: [],
        /**
         * @property {Array} list - 表格数据
         */
        list: [],
        /**
         * @property {Object} tooltip - 工具提示
         */
        tooltip: {
            show: false,
            text: ''
        }
    },
    mounted: function () {
        this.init();
    },
    methods: {
        init: function () {
            this.initData();
        },
        initData: function () {
            var _a = this.data, columns = _a.columns, dataSource = _a.dataSource, rowH = _a.rowH;
            var _b = (0, tool_1.normalizeColumns)(columns), leftColumns = _b.leftColumns, middleColumns = _b.middleColumns;
            var _c = (0, tool_1.normalizeDataSource)({
                leftColumns: leftColumns,
                middleColumns: middleColumns,
                dataSource: dataSource,
                rowH: rowH
            }), height = _c.height, list = _c.list;
            this.setData({
                leftColumns: leftColumns,
                middleColumns: middleColumns,
                height: height,
                list: list
            });
        },
        /**
         * @description 点击表格项
         * @returns {void}
         */
        handleToNext: function (e) {
            var index = e.currentTarget.dataset.index;
            this.triggerEvent('onNext', { index: index });
        },
        /**
         * @description 表格排序
         * @returns {void}
         */
        handleChangeSort: function (e) {
            var _a = e.currentTarget.dataset, sortable = _a.sortable, field = _a.field;
            if (sortable) {
                this.triggerEvent('onChangeSort', { field: field, type: this.data.sortType });
            }
        },
        /**
         * @description 显示提示弹窗
         * @returns {void}
         */
        handleShowToolTip: function (e) {
            var _a = e.currentTarget.dataset, field = _a.field, index = _a.index, tooltip = _a.tooltip;
            var show = (tooltip || {}).show;
            if (show) {
                var item = this.data.dataSource[index];
                var text = item[field + '_tooltip'];
                if (text) {
                    this.setData({
                        tooltip: {
                            text: text,
                            show: true
                        }
                    });
                }
            }
        },
        /**
         * @description 隐藏提示弹窗
         * @returns {void}
         */
        handleHideTooltip: function () {
            this.setData({
                tooltip: {
                    show: false,
                    text: ''
                }
            });
        },
        noop: function () { }
    }
});

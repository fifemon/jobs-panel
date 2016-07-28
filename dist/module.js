'use strict';

System.register(['app/plugins/sdk', 'lodash', 'moment'], function (_export, _context) {
    "use strict";

    var MetricsPanelCtrl, _, moment, _createClass, _get, JobsCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    function background_style(value, limit) {
        var bg;
        if (value > limit) {
            bg = ' style="background-color:rgba(245, 54, 54, 0.9);color: white"';
        } else if (value > limit * 0.9) {
            bg = ' style="background-color:rgba(237, 129, 40, 0.890196);color: black"';
        } else {
            bg = '';
        }
        return bg;
    }

    return {
        setters: [function (_appPluginsSdk) {
            MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
        }, function (_lodash) {
            _ = _lodash.default;
        }, function (_moment) {
            moment = _moment.default;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            _get = function get(object, property, receiver) {
                if (object === null) object = Function.prototype;
                var desc = Object.getOwnPropertyDescriptor(object, property);

                if (desc === undefined) {
                    var parent = Object.getPrototypeOf(object);

                    if (parent === null) {
                        return undefined;
                    } else {
                        return get(parent, property, receiver);
                    }
                } else if ("value" in desc) {
                    return desc.value;
                } else {
                    var getter = desc.get;

                    if (getter === undefined) {
                        return undefined;
                    }

                    return getter.call(receiver);
                }
            };

            _export('PanelCtrl', _export('JobsCtrl', JobsCtrl = function (_MetricsPanelCtrl) {
                _inherits(JobsCtrl, _MetricsPanelCtrl);

                function JobsCtrl($scope, $injector, $rootScope, templateSrv) {
                    _classCallCheck(this, JobsCtrl);

                    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(JobsCtrl).call(this, $scope, $injector));

                    _this.$rootScope = $rootScope;
                    _this.templateSrv = templateSrv;

                    var panelDefaults = {
                        mode: "Active", // "Active","Completed"
                        size: 100,
                        scroll: true,
                        sortField: 'submit_date',
                        sortOrder: 'asc',
                        queries: [{ name: "-- custom --", query: "" }],
                        columns: [{ name: "Job ID", field: "jobid", format: 'jobid',
                            title: "JobSub job ID" }, { name: "Status", field: "status", format: 'string',
                            title: "Job Status (1=idle,2=running,5=held)" }, { name: "Submit Time", field: "submit_date", format: 'date',
                            title: "Time job was sumbitted" }, { name: "Memory (MB)", field: "ResidentSetSize_RAW", format: 'number',
                            title: "Max used and requested memory" }, { name: "Disk (MB)", field: "DiskUsage_RAW", format: 'number',
                            title: "Max used and requested disk" }, { name: "Time (hr)", field: "walltime", format: 'number',
                            title: "Max used and requested walltime" }, { name: "Efficiency", field: "efficiency", format: 'number',
                            title: "CPU efficiency (CPU time / walltime)" }]
                    };
                    _.defaults(_this.panel, panelDefaults);

                    _this.data = [];
                    _this.docs = 0;
                    _this.docsMissing = 0;
                    _this.docsTotal = 0;
                    _this.filterQuery = { name: "all jobs", query: "" };
                    _this.customQuery = "";

                    _this.events.on('data-received', _this.onDataReceived.bind(_this));
                    _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
                    return _this;
                }

                _createClass(JobsCtrl, [{
                    key: 'onInitEditMode',
                    value: function onInitEditMode() {
                        this.addEditorTab('Options', 'public/plugins/fifemon-jobs-panel/editor.html', 2);
                        this.addEditorTab('Columns', 'public/plugins/fifemon-jobs-panel/editor_columns.html', 3);
                    }
                }, {
                    key: 'issueQueries',
                    value: function issueQueries(datasource) {
                        this.updateTimeRange();
                        this.datasource = datasource;
                        return datasource._post(datasource.indexPattern.getIndexForToday() + '/' + '_search', this.get_jobs_query()).then(function (res) {
                            return { data: res };
                        });
                    }
                }, {
                    key: 'onDataReceived',
                    value: function onDataReceived(data) {
                        if (data) {
                            this.data = data.hits.hits;
                            this.docsTotal = data.hits.total;
                            this.docs = this.data.length;
                            this.docsMissing = this.docsTotal - this.docs;
                        } else {
                            this.data = [];
                            this.docsTotal = 0;
                            this.docs = 0;
                            this.docsMissing = 0;
                        }
                        this.render(this.data);
                    }
                }, {
                    key: 'render',
                    value: function render() {
                        return _get(Object.getPrototypeOf(JobsCtrl.prototype), 'render', this).call(this, this.data);
                    }
                }, {
                    key: 'toggleSort',
                    value: function toggleSort(field) {
                        if (field === this.panel.sortField) {
                            this.panel.sortOrder = this.panel.sortOrder === 'asc' ? 'desc' : 'asc';
                        } else {
                            this.panel.sortField = field;
                            this.panel.sortOrder = 'asc';
                        }
                        this.refresh();
                    }
                }, {
                    key: 'addQuery',
                    value: function addQuery() {
                        var custom = this.panel.queries.pop();
                        this.panel.queries.push({ name: 'new query', query: '' });
                        this.panel.queries.push(custom);
                    }
                }, {
                    key: 'removeQuery',
                    value: function removeQuery(name) {
                        _.remove(this.panel.queries, { 'name': name });
                    }
                }, {
                    key: 'addColumn',
                    value: function addColumn() {
                        this.panel.columns.push({ name: '', field: '', format: 'string', title: '' });
                    }
                }, {
                    key: 'removeColumn',
                    value: function removeColumn(name) {
                        _.remove(this.panel.columns, { 'name': name });
                    }
                }, {
                    key: 'link',
                    value: function link(scope, elem, attrs, ctrl) {
                        var data;
                        var panel = ctrl.panel;
                        var pageCount = 0;

                        function getTableHeight() {
                            var panelHeight = ctrl.height;
                            /*if (pageCount > 1) {
                                panelHeight -= 26;
                            }*/
                            return panelHeight - 31 + 'px';
                        }

                        function renderPanel() {
                            var root = elem.find('.table-panel-scroll');
                            root.css({ 'max-height': panel.scroll ? getTableHeight() : '' });

                            var tbody = elem.find('tbody');
                            renderTable(tbody);
                        }

                        function renderTable(tbody) {
                            tbody.empty();
                            var html = '';
                            for (var i = 0; i < data.length; i++) {
                                html += renderActiveRow(data[i], i === 0);
                            }
                            tbody.html(html);
                        }

                        function renderActiveRow(data) {
                            var addWidthHack = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

                            function formatDate(date) {
                                return moment(date).format('ddd MMM DD HH:mm ZZ');
                            }

                            var html = '<tr>';

                            for (var i = 0; i < panel.columns.length; i++) {
                                html += '<td>';
                                var col = panel.columns[i];
                                switch (col.format) {
                                    case 'jobid':
                                        html += '<a style="text-decoration:underline;" href="dashboard/db/job-details?var-jobid=' + data._source.jobid + '&from=' + moment(data._source.submit_date).format('x') + '&to=' + ctrl.rangeRaw.to + '">' + data._source.jobid + '</a>';
                                        break;
                                    case 'date':
                                        html += formatDate(data._source[col.field]);
                                        break;
                                    default:
                                        html += data._source[col.field];
                                }
                                // because of the fixed table headers css only solution
                                // there is an issue if header cell is wider the cell
                                // this hack adds header content to cell (not visible)
                                var widthHack = '';
                                if (addWidthHack) {
                                    widthHack = '<div class="table-panel-width-hack">' + col.name + '</div>';
                                }

                                html += widthHack + '</td>';
                            }

                            html += '</tr>';
                            return html;
                        }

                        ctrl.events.on('render', function (renderData) {
                            data = renderData || data;
                            if (data) {
                                renderPanel();
                            }
                            ctrl.renderingCompleted();
                        });
                    }
                }, {
                    key: 'get_jobs_query',
                    value: function get_jobs_query() {
                        var q = '*';
                        if (this.panel.targets[0].query) {
                            q = this.templateSrv.replace(this.panel.targets[0].query, this.panel.scopedVars);
                        }
                        if (this.filterQuery && this.filterQuery.name === '-- custom --') {
                            if (this.customQuery !== '') {
                                q += ' AND (' + this.customQuery + ')';
                            }
                        } else if (this.filterQuery && this.filterQuery.query !== '') {
                            q += ' AND (' + this.filterQuery.query + ')';
                        }

                        var from = this.rangeRaw.from;
                        var to = this.rangeRaw.to;
                        // time range hack; really should have separate indices for active and completed jobs
                        if (this.panel.mode === 'Active') {
                            from = 'now-10m';
                            to = 'now';
                        } else if (this.panel.mode === 'Completed' && to === 'now') {
                            to = 'now-10m';
                        }

                        var sort = {};
                        sort[this.panel.sortField] = this.panel.sortOrder;

                        var data = {
                            "size": this.panel.size,
                            "query": {
                                "filtered": {
                                    "query": {
                                        "query_string": {
                                            "query": q,
                                            "lowercase_expanded_terms": false
                                        }
                                    },
                                    "filter": {
                                        "range": { "timestamp": { "gte": from, "lte": to } }
                                    }
                                }
                            },
                            "sort": [sort, "_score"]
                        };
                        return data;
                    }
                }]);

                return JobsCtrl;
            }(MetricsPanelCtrl)));

            _export('JobsCtrl', JobsCtrl);

            JobsCtrl.templateUrl = 'module.html';

            _export('PanelCtrl', JobsCtrl);
        }
    };
});
//# sourceMappingURL=module.js.map

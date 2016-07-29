import {MetricsPanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import moment from 'moment';

function background_style(value, limit) {
    var bg;
    if (value > limit) {
        bg=' style="background-color:rgba(245, 54, 54, 0.9);color: white"';
    } else if (value > limit*0.9) {
        bg=' style="background-color:rgba(237, 129, 40, 0.890196);color: black"';
    } else {
        bg='';
    }
    return bg;
}

export class JobsCtrl extends MetricsPanelCtrl {

  constructor($scope, $injector, $rootScope, templateSrv) {
    super($scope, $injector);
    this.$rootScope = $rootScope;
    this.templateSrv = templateSrv;

    var panelDefaults = {
        size: 100,
        scroll: true,
        sortField: 'submit_date',
        sortOrder: 'asc',
        filterable: true,
        queries: [
            {name: "-- no filter --", query:""}
        ],
        columns: [
            {name: "Job ID", field: "jobid", format: 'jobid',
                title: "JobSub job ID"},
            {name: "Status", field: "status", format: 'string',
                title: "Job Status (1=idle,2=running,5=held)"},
            {name: "Submit Time", field: "submit_date", format: 'date',
                title: "Time job was sumbitted"},
            {name: "Memory (MB)", field: "ResidentSetSize_RAW", format: 'number',
                decimals: 2, scale: 1,
                title: "Max used and requested memory"},
            {name: "Disk (MB)",field: "DiskUsage_RAW", format: 'number',
                decimals: 2, scale: 1,
                title: "Max used and requested disk"},
            {name: "Time (hr)",field: "walltime", format: 'number',
                decimals: 2, scale: 1,
                title: "Max used and requested walltime"},
            {name: "Efficiency", field: "efficiency", format: 'number',
                decimals: 2, scale: 1,
                title: "CPU efficiency (CPU time / walltime)"}
        ]
    };
    _.defaults(this.panel, panelDefaults);

    this.data = [];
    this.docs = 0;
    this.docsMissing = 0;
    this.docsTotal = 0;
    this.selectedFilter = this.panel.queries[0];
    this.filterQuery = this.selectedFilter.query;

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/fifemon-jobs-panel/editor.html', 2);
    this.addEditorTab('Columns', 'public/plugins/fifemon-jobs-panel/editor_columns.html', 3);
  }

  issueQueries(datasource) {
      this.updateTimeRange();
      this.datasource=datasource;
      return datasource._post(datasource.indexPattern.getIndexForToday()+'/'+'_search',this.get_jobs_query()).then(function(res) {
          return {data: res};
      });
  }

  onDataReceived(data) {
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

  render() {
      return super.render(this.data);
  }

  toggleSort(field) {
      if (field === this.panel.sortField) {
          this.panel.sortOrder = this.panel.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
          this.panel.sortField = field;
          this.panel.sortOrder = 'asc';
      }
      this.refresh();
  }

  updateFilter() {
      this.filterQuery = this.selectedFilter.query;
      this.refresh();
  }

  addQuery() {
      this.panel.queries.push({name:'',query:''});
  }

  removeQuery(index) {
      if (this.panel.queries.length > index) {
          this.panel.queries.splice(index,1);
      }
  }

  moveQueryUp(index) {
      if (this.panel.queries.length > index && index > 0) {
          var tmp = this.panel.queries[index];
          this.panel.queries[index]=this.panel.queries[index-1];
          this.panel.queries[index-1]=tmp;
      }
  }

  moveQueryDown(index) {
      if (this.panel.queries.length > index-1 && index >= 0) {
          var tmp = this.panel.queries[index];
          this.panel.queries[index]=this.panel.queries[index+1];
          this.panel.queries[index+1]=tmp;
      }
  }

  addColumn() {
      this.panel.columns.push({name:'',field:'',format:'string',title:''});
      this.refresh();
  }

  removeColumn(index) {
      if (this.panel.columns.length > index) {
          this.panel.columns.splice(index,1);
      }
      this.refresh();
  }

  moveColumnUp(index) {
      if (this.panel.columns.length > index && index > 0) {
          var tmp = this.panel.columns[index];
          this.panel.columns[index]=this.panel.columns[index-1];
          this.panel.columns[index-1]=tmp;
      }
      this.refresh();
  }

  moveColumnDown(index) {
      if (this.panel.columns.length > index-1 && index >= 0) {
          var tmp = this.panel.columns[index];
          this.panel.columns[index]=this.panel.columns[index+1];
          this.panel.columns[index+1]=tmp;
      }
      this.refresh();
  }

  link(scope, elem, attrs, ctrl) {
      var data;
      var panel = ctrl.panel;
      var pageCount = 0;

      function getTableHeight() {
          var panelHeight = ctrl.height;
          /*if (pageCount > 1) {
              panelHeight -= 26;
          }*/
          return (panelHeight - 31) + 'px';
      }

      function renderPanel() {
          var root = elem.find('.table-panel-scroll');
          root.css({'max-height': panel.scroll ? getTableHeight() : ''});

          var tbody = elem.find('tbody');
          renderTable(tbody);
      }

      function renderTable(tbody) {
          tbody.empty();
          var html = '';
          for (var i = 0; i < data.length; i++) {
              html += renderActiveRow(data[i],i===0);
          }
          tbody.html(html);
      }

      function renderActiveRow(data, addWidthHack = false) {
          var html = '<tr>';

          for (var i = 0; i < panel.columns.length; i++) {
              html += '<td>';
              var col = panel.columns[i];
              if (col.field in data._source) {
                  var val = data._source[col.field];
                  switch (col.format) {
                      case 'jobid':
                          html += '<a style="text-decoration:underline;" href="dashboard/db/job-details?var-jobid='+data._source.jobid+'&from='+moment(data._source.submit_date).format('x')+'&to='+ctrl.rangeRaw.to+'">'+data._source.jobid+'</a>';
                          break;
                      case 'date':
                          if (col.dateFormat) {
                              html += moment(val).format(col.dateFormat);
                          } else {
                              html += moment(val).format('ddd MMM DD HH:mm ZZ');
                          }
                          break;
                      case 'number':
                          if (col.scale) {
                              val = val * col.scale;
                          }
                          if (col.decimals) {
                              html += val.toFixed(col.decimals);
                          } else {
                              html += val.toFixed(0);
                          }
                          break;
                      default:
                          html += val;
                  }
              } else {
                  html += '&mdash;';
              }
              // because of the fixed table headers css only solution
              // there is an issue if header cell is wider the cell
              // this hack adds header content to cell (not visible)
              var widthHack = '';
              if (addWidthHack) {
                  widthHack = '<div class="table-panel-width-hack">' + col.name + '</div>';
              }

              html += widthHack+'</td>';
          }

          html += '</tr>';
          return html;
      }


      ctrl.events.on('render', function(renderData) {
          data = renderData || data;
          if (data) {
              renderPanel();
          }
          ctrl.renderingCompleted();
      });
  }

  get_jobs_query() {
      var q = '*';
      if (this.panel.targets[0].query) {
          q = this.templateSrv.replace(this.panel.targets[0].query, this.panel.scopedVars);
      }
      if (this.filterQuery !== '') {
          q += ' AND (' + this.filterQuery + ')';
      }

      var from = this.rangeRaw.from;
      var to = this.rangeRaw.to;

      var sort = {};
      sort[this.panel.sortField] = this.panel.sortOrder;

      var data = {
          "size": this.panel.size,
          "query": {
              "query_string": {
                  "query": q,
                  "lowercase_expanded_terms": false
              }
          },
          "sort": [
              sort,
              "_score"
              ]
      };
      return data;
  }

}

JobsCtrl.templateUrl = 'module.html';

export {
  JobsCtrl as PanelCtrl
};


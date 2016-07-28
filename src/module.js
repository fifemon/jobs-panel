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
        mode: "Active", // "Active","Completed"
        size: 100,
        scroll: true,
        sortField: 'submit_date',
        sortOrder: 'asc',
        queries: [
            {name: "-- custom --", query:""}
        ],
        columns: [
            {name: "Job ID", field: "jobid", format: 'jobid',
                title: "JobSub job ID"},
            {name: "Status", field: "status", format: 'string',
                title: "Job Status (1=idle,2=running,5=held)"},
            {name: "Submit Time", field: "submit_date", format: 'date',
                title: "Time job was sumbitted"},
            {name: "Memory (MB)", field: "ResidentSetSize_RAW", format: 'number',
                title: "Max used and requested memory"},
            {name: "Disk (MB)",field: "DiskUsage_RAW", format: 'number',
                title: "Max used and requested disk"},
            {name: "Time (hr)",field: "walltime", format: 'number',
                title: "Max used and requested walltime"},
            {name: "Efficiency", field: "efficiency", format: 'number',
                title: "CPU efficiency (CPU time / walltime)"}
        ]
    };
    _.defaults(this.panel, panelDefaults);

    this.data = [];
    this.docs = 0;
    this.docsMissing = 0;
    this.docsTotal = 0;
    this.filterQuery = {name: "all jobs",query:""};
    this.customQuery = "";

    this.events.on('data-received', this.onDataReceived.bind(this));
    this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
  }

  onInitEditMode() {
    this.addEditorTab('Options', 'public/plugins/fifemon-jobs-panel/editor.html', 2);
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

  addQuery() {
      var custom = this.panel.queries.pop();
      this.panel.queries.push({name:'new query',query:''});
      this.panel.queries.push(custom);
  }

  removeQuery(name) {
      _.remove(this.panel.queries, {'name':name});
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
          function formatDate(date) {
              return  moment(date).format('ddd MMM DD HH:mm ZZ');
          }

          var html = '<tr>';

          for (var i = 0; i < panel.columns.length; i++) {
              html += '<td>';
              var col = panel.columns[i];
              switch (col.format) {
                  case 'jobid':
                      html += '<a style="text-decoration:underline;" href="dashboard/db/job-details?var-jobid='+data._source.jobid+'&from='+moment(data._source.submit_date).format('x')+'&to='+ctrl.rangeRaw.to+'">'+data._source.jobid+'</a>';
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
                      "range": { "timestamp": { "gte": from, "lte": to }}
                  }
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


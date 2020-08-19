export function ptwq_chart_assembly(QEWD, state) {

    state = state || {};
    state.name = state.name || 'crud-' + Date.now();
    state.title = state.title || 'CRUD Page';
    state.summary = state.summary || {};
    state.detail = state.detail || {};
    state.update = state.update || {};
    /**
     * False if patient_id filtering / adding no needed
     * @type {*|boolean}
     */
    state.patientIdDepends = state.patientIdDepends || true;
    state.summary.headers = state.summary.headers || [];


    state.summary.data_properties = state.summary.data_properties || [];

    if (state.patientIdDepends) {
        state.summary.headers.push('Patient ID');
        state.summary.data_properties.push('patient_id');
    }


    if (state.summary.headers.length === state.summary.data_properties.length) {
        state.summary.headers.push('Select');
    }
    ;

    let formFields = {};
    let formFieldPropertyNames = {};
    if (state.detail.fields) {
        state.detail.fields.forEach(function (field, index) {
            if (field.name && !field.data_property) field.data_property = field.name;
            if (!field.name && field.data_property) field.name = field.data_property;
            formFields[field.data_property] = state.detail.fields[index];
            formFieldPropertyNames[field.name] = field.data_property;
        });
    }


    let getDetailsActions = async function(id, _this) {
        let card = _this.getComponentByName('adminui-content-card', state.name + '-details-card');
        let form = _this.getComponentByName('adminui-form', state.name);

        form.recordId = id;

        /*
        QEWD.send({
          type: state.summary.qewd.getDetail,
          params: {
            id: id
          }
        }, function(responseObj) {
        */
        let responseObj = await QEWD.reply({
            type: state.summary.qewd.getDetail,
            params: {
                id: id
            }
        });
        if (!responseObj.message.error) {
            card.show();
            card.classList.remove('d-none');

            card.footer.hide();
            _this.record = responseObj.message.record;
            let title_value;
            if (typeof state.detail.title_data_property === 'function') {
                title_value = state.detail.title_data_property.call(_this);
            } else {
                title_value = _this.record[state.detail.title_data_property];
            }

            let title = card.querySelector('adminui-content-card-button-title');
            title.setState({title: title_value});
            title.showButton();

            for (let fname in formFields) {
                let name = formFields[fname].name;
                let field = form.field[name];

                if (field.type === 'radio-group') {
                    field.setState({
                        selectedValue: _this.record[name],
                        readonly: true
                    });
                } else if (field.type === 'checkbox-group') {
                    field.setState({
                        selectedValues: _this.record[name],
                        readonly: true
                    });
                } else if (field.type === 'select-multiple') {
                    field.setState({
                        selectedValues: _this.record[name],
                        readonly: true
                    });
                } else {
                    if (field.type === 'range' && !_this.record[name]) {
                        _this.record[name] = field.min;
                    }
                    field.setState({
                        value: _this.record[name],
                        readonly: true
                    });
                }
            }
        }
        //});
    };

    let chartConfigGenerator = async function(context){
        return new Promise((resolve, reject)=> {
            QEWD.reply({
                type: state.summary.qewd.getSummary,
                params: {
                    properties: ['heartrate', 'resprate', 'systolic_bp', 'score', 'patient_id']
                }
            })
                .then((responseObj) => {
                    console.log(responseObj);

                    let data = [];
                    let heartrate = [], resprate = [], systolic_rate = [];
                    let labels = [];

                    responseObj.message.summary.forEach(function (record) {
                        if (context.selectedPatient && state.patientIdDepends) {
                            if (context.selectedPatient.id !== record.patient_id) {
                                return true; // SKIP BY FILTER
                            }
                        }
                        data.push(record);
                    });
                    console.log(responseObj.message.summary);
                    let result = data.forEach(el => {
                        labels.push(el.id);
                        heartrate.push({
                            x: el.id,
                            y: el.heartrate,
                            value: el.id,
                            name: el.heartrate,
                        })
                        resprate.push({
                            x: el.id,
                            y: el.resprate,
                            value: el.id,
                            name: el.resprate,
                        })
                        systolic_rate.push({
                            x: el.id,
                            y: el.systolic_bp,
                            value: el.id,
                            name: el.systolic_bp,
                        })
                    });
                    console.log(systolic_rate);
                    let config = {
                        type: 'line',

                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Heart Rate',
                                backgroundColor: 'rgba(226,57,57,0.5)',
                                borderColor: '#e23939',
                                fill: false,
                                data: heartrate,
                            }, {
                                label: 'Resp Rate',
                                backgroundColor: 'rgba(57,171,226,0.5)',
                                borderColor: '#39abe2',
                                fill: false,
                                data: resprate,
                            }, {
                                label: 'Systolic Rate',
                                backgroundColor: 'rgba(226,57,220,0.5)',
                                borderColor: '#e239dc',
                                fill: false,
                                data: systolic_rate,
                            }],
                        },
                        options: {
                            responsive: true,

                            tooltips: {
                                mode: 'index',
                                intersect: false,
                            },
                            hover: {
                                mode: 'nearest',
                                intersect: true
                            },
                            scales: {
                                xAxes: [{
                                    display: true,
                                    scaleLabel: {
                                        display: true,
                                        labelString: 'Month'
                                    }
                                }],
                                yAxes: [{
                                    display: true,
                                    scaleLabel: {
                                        display: true,
                                        labelString: 'Value'
                                    }
                                }]
                            }
                        }


                    };

                    resolve(config);
                });
        });
    }
    let component = {
        componentName: 'ptwq-content-page',
        assemblyName: state.assemblyName,
        state: {
            name: state.name
        },
        children: [

            {
                componentName: 'ptwq-topheader',
                state: {
                    name: 'top-header-patient',
                }
            },
            {
                componentName: 'ptwq-breadcumps',
                state: {
                    name: 'breadcumps-patient',
                    currentPage: state.title,
                }
            },
            {
                componentName: 'adminui-content-page-header',
                state: {
                    title: state.title
                }
            },
            {
                componentName: 'adminui-row',
                children: [
                    {
                        componentName: 'adminui-content-card',
                        state: {
                            name: state.name + '-chart-card'
                        },
                        children: [
                            {
                                componentName: 'adminui-content-card-header',
                                children: [
                                    {
                                        componentName: 'ptwq-content-card-multibutton-title',
                                        state: {
                                            title: state.summary.title,
                                            title_colour: state.summary.titleColour,
                                        },
                                        children: [
                                            {
                                                componentName: 'adminui-button',
                                                state: {
                                                    title: 'Show Chart',
                                                    name: state.name + '-show-chart-button',
                                                    title_colour: state.summary.titleColour,
                                                    icon: 'table',
                                                    buttonColour: state.summary.btnColour,
                                                    tooltip: state.summary.btnTooltip,
                                                    hideButton: true,
                                                },
                                                hooks: ['showVitals']
                                            },
                                            {
                                                componentName: 'adminui-button',
                                                state: {
                                                    title: 'Full screen',
                                                    name: state.name + '-summary-full-screen',
                                                    title_colour: state.summary.titleColour,
                                                    icon: 'expand-alt',
                                                    buttonColour: state.summary.btnColour,
                                                    tooltip: state.summary.btnTooltip,
                                                    hideButton: true,
                                                },
                                                hooks: ['fullScreen']
                                            },
                                            {
                                                componentName: 'adminui-button',
                                                state: {
                                                    title: 'Create new record',
                                                    title_colour: state.summary.titleColour,
                                                    icon: state.summary.btnIcon,
                                                    buttonColour: state.summary.btnColour,
                                                    tooltip: state.summary.btnTooltip,
                                                    hideButton: state.summary.disableAdd
                                                },
                                                hooks: ['createNewRecord']

                                            }
                                        ],
                                    }
                                ]
                            },
                            {
                                componentName: 'adminui-content-card-body',
                                children: [
                                    {
                                        componentName: 'adminui-chart',
                                        name: state.name + '-chart',
                                        hooks: ['getChartData']
                                    }
                                ]
                            }
                        ],
                        hooks: ['chartBlockHook']
                    },
                    {
                        componentName: 'adminui-content-card',
                        state: {
                            name: state.name + '-summary-card'
                        },
                        children: [
                            {
                                componentName: 'adminui-content-card-header',
                                children: [
                                    {
                                        componentName: 'ptwq-content-card-multibutton-title',
                                        state: {
                                            title: state.summary.title,
                                            title_colour: state.summary.titleColour,
                                        },
                                        children: [
                                            {
                                                componentName: 'adminui-button',
                                                state: {
                                                    title: 'Show chart',
                                                    name: state.name + '-show-chart-button',
                                                    title_colour: state.summary.titleColour,
                                                    icon: 'chart-line',
                                                    buttonColour: state.summary.btnColour,
                                                    tooltip: state.summary.btnTooltip,
                                                    hideButton: true,
                                                },
                                                hooks: ['showChart']
                                            },
                                            {
                                                componentName: 'adminui-button',
                                                state: {
                                                    title: 'Full screen',
                                                    name: state.name + '-summary-full-screen',
                                                    title_colour: state.summary.titleColour,
                                                    icon: 'expand-alt',
                                                    buttonColour: state.summary.btnColour,
                                                    tooltip: state.summary.btnTooltip,
                                                    hideButton: true,
                                                },
                                                hooks: ['fullScreen']
                                            },
                                            {
                                                componentName: 'adminui-button',
                                                state: {
                                                    title: 'Create new record',
                                                    title_colour: state.summary.titleColour,
                                                    icon: state.summary.btnIcon,
                                                    buttonColour: state.summary.btnColour,
                                                    tooltip: state.summary.btnTooltip,
                                                    hideButton: state.summary.disableAdd
                                                },
                                                hooks: ['createNewRecord']

                                            }
                                        ],
                                    },
                                ]
                            },
                            {
                                componentName: 'adminui-content-card-body',
                                children: [
                                    {
                                        componentName: 'adminui-datatables',
                                        state: {
                                            name: state.name
                                        },
                                        hooks: ['retrieveRecordSummary']
                                    },
                                ]
                            }
                        ],
                        hooks: ['summaryHook']
                    },
                    {
                        componentName: 'adminui-content-card',
                        state: {
                            name: state.name + '-details-card',
                            hide: true,
                        },
                        hooks: ['detailsHook'],
                        children: [
                            {
                                componentName: 'adminui-content-card-header',
                                children: [
                                    {
                                        componentName: 'adminui-content-card-button-title',
                                        state: {
                                            title: state.detail.title,
                                            title_colour: state.detail.titleColour,
                                            icon: state.detail.btnIcon,
                                            buttonColour: state.detail.btnColour,
                                            tooltip: state.detail.btnTooltip || 'Edit record',
                                            disableButton: state.detail.disableEdit
                                        },
                                        hooks: ['updateRecord']
                                    }
                                ]
                            },
                            {
                                componentName: 'adminui-content-card-body',
                                state: {
                                    name: state.name + '-details-card-body'
                                },
                                children: [
                                    {
                                        componentName: 'adminui-form',
                                        state: {
                                            name: state.name
                                        },
                                        hooks: ['addFormFields']
                                    },
                                ]
                            },
                            {
                                componentName: 'adminui-content-card-footer',
                                state: {
                                    hidden: true
                                },
                                children: [
                                    {
                                        componentName: 'adminui-button',
                                        state: {
                                            text: state.update.btnText || 'Save',
                                            colour: state.update.btnColour || 'success',
                                            cls: 'btn-block'
                                        },
                                        hooks: ['save']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
        ]
    };


    let showRecordBtn = {
        componentName: 'adminui-button',
        assemblyName: state.assemblyName,
        state: {
            icon: state.summary.rowBtnIcon,
            colour: state.summary.rowBtnColour
        },
        hooks: ['getDetail']
    };

    let deleteBtn = {
        assemblyName: state.assemblyName,
        componentName: 'adminui-button',
        state: {
            icon: 'trash-alt',
            colour: 'danger'
        },
        hooks: ['confirmDelete']
    };

    let confirmDeleteModal = {
        componentName: 'adminui-modal-root',
        assemblyName: state.assemblyName,
        state: {
            name: 'confirm-delete-' + state.name
        },
        children: [
            {
                componentName: 'adminui-modal-header',
                state: {
                    name: state.name + '-delete',
                    title: 'Delete Record'
                },
                children: [
                    {
                        componentName: 'adminui-modal-close-button',
                    }
                ]
            },
            {
                componentName: 'adminui-modal-body',
                state: {
                    text: 'Are you sure you want to delete this record?'
                }
            },
            {
                componentName: 'adminui-modal-footer',
                children: [
                    {
                        componentName: 'adminui-modal-cancel-button',
                    },
                    {
                        componentName: 'adminui-button',
                        state: {
                            name: 'deleteRecord-' + state.name,
                            text: state.name + ' Yes',
                            colour: 'danger',
                            cls: 'btn-block'
                        },
                        hooks: ['delete']
                    }
                ]
            }
        ]
    };


    let hooks = {

        'ptwq-content-page': {

            loadModal: function () {
                let modal = this.getComponentByName('adminui-modal-root', 'confirm-delete-' + state.name);
                if (!modal) {
                    // add modal for confirming record deletions
                    this.loadGroup(confirmDeleteModal, document.getElementsByTagName('body')[0], this.context);
                }

                let table = this.getComponentByName('adminui-datatables', state.name);

                let target = table
                    .getParentComponent('adminui-content-card-body')

                if (target) {
                    target = target.querySelector('.card-body');
                }
                if (table.datatable) {
                    table.datatable.destroy();
                    table.remove();

                }


                let assembly = {
                    componentName: 'adminui-datatables',
                    assemblyName: state.assemblyName,
                    state: {
                        name: state.name
                    },
                    hooks: ['retrieveRecordSummary']
                };
                this.loadGroup(assembly, target, this.context);
            }
        },

        'adminui-form': {

            addFormFields: function () {
                let form = this;
                let fields = state.detail.fields;
                let noOfFields = fields.length;

                function addFormField(no) {
                    if (no === noOfFields) return;

                    var field = fields[no];
                    let componentName = 'adminui-form-field';
                    var assembly;

                    if (field.type === 'radios') {
                        assembly = {
                            componentName: 'adminui-form-radio-group',
                            state: {
                                name: field.name,
                                label: field.label,
                                radios: field.radios
                            }
                        };
                        form.loadGroup(assembly, form, form.context, function () {
                            addFormField(no + 1);
                        });
                        return;
                    }

                    if (field.type === 'checkboxes') {
                        let checkboxes = [];
                        field.checkboxes.forEach(function (checkbox) {
                            if (typeof checkbox.if === 'function') {
                                if (!checkbox.if.call(form)) {
                                    return;
                                }
                            }
                            checkboxes.push({
                                text: checkbox.text,
                                value: checkbox.value
                            });
                        });
                        assembly = {
                            componentName: 'adminui-form-checkbox-group',
                            state: {
                                name: field.name,
                                label: field.label,
                                checkboxes: checkboxes
                            }
                        };
                        form.loadGroup(assembly, form, form.context, function () {
                            addFormField(no + 1);
                        });
                        return;
                    }

                    if (field.type === 'range') componentName = 'adminui-form-range';
                    if (field.type === 'select') componentName = 'adminui-form-select';
                    if (field.type === 'multiselect') componentName = 'adminui-form-select-multiple';
                    if (field.type === 'textarea') componentName = 'adminui-form-textarea';
                    assembly = {
                        componentName: componentName,
                        state: {
                            name: field.name,
                            type: field.type,
                            label: field.label,
                            placeholder: field.placeholder,
                            readonly: true,
                            row: field.labelWidth
                        }
                    };
                    if (field.type === 'select' || field.type === 'multiselect') {
                        assembly.hooks = ['displayOptions'];
                        assembly.state.options = field.options;
                    }

                    if (field.type === 'range') {
                        assembly.state.min = field.min;
                        assembly.state.max = field.max;
                        assembly.state.step = field.step;
                        assembly.state.marker = field.marker;
                    }

                    if (field.type === 'textarea') {
                        assembly.state.height = field.height;
                        assembly.state.rows = field.rows;
                    }

                    form.loadGroup(assembly, form, form.context, function () {
                        addFormField(no + 1);
                    });
                }

                addFormField(0);
            }
        },

        'adminui-form-select': {
            displayOptions: function (state) {
                this.setState({options: state.options});
            }
        },

        'adminui-form-select-multiple': {
            displayOptions: function (state) {
                this.setState({options: state.options});
            }
        },

        'adminui-datatables': {

            retrieveRecordSummary: async function () {
                let table = this;
                let context = this.context;

                console.log('retrive-record');
                QEWD.send({
                    type: state.summary.qewd.getSummary,
                    params: {
                        properties: state.summary.data_properties
                    }
                }, function (responseObj) {

                    /*let responseObj = await QEWD.reply({
                        type: state.summary.qewd.getSummary,
                        params: {
                            properties: state.summary.data_properties
                        }
                    });*/
                    if (!responseObj.message.error) {
                        table.data = {};
                        let data = [];
                        responseObj.message.summary.forEach(function (record) {
                            console.log('there234');
                            if (context.selectedPatient && state.patientIdDepends) {
                                if (context.selectedPatient.id !== record.patient_id) {
                                    return true; // SKIP BY FILTER
                                }
                            }
                            table.data[record.id] = record;
                            let row = [];
                            state.summary.data_properties.forEach(function (property) {
                                row.push(record[property]);
                            });
                            row.push(record.id);
                            if (state.summary.enableDelete) {
                                row.push('');
                            }
                            data.push(row);
                        });
                        let columns = [];
                        let noOfCols = state.summary.headers.length;

                        state.summary.headers.forEach(function (header) {
                            columns.push({title: header});
                        });
                        if (state.summary.enableDelete) {
                            columns.push({title: 'Delete'});
                        }
                        let obj = {
                            data: data,
                            columns: columns
                        };
                        //        if (table.datatable) this.datatable.destroy();

                        table.render(obj);
                        table.datatable.rows().every(function (index, element) {
                            let row = $(this.node());
                            let td = row.find('td').eq(noOfCols - 1)[0];
                            let id = td.textContent;
                            table.row = table.data[id];
                            td.id = state.name + '-record-' + id;
                            td.textContent = '';
                            if (state.summary.enableDelete) {
                                td = row.find('td').eq(noOfCols)[0];
                                td.id = state.name + '-delete-' + id;
                                let confirmTextFn = state.summary.deleteConfirmText;
                                let confirmText;
                                if (typeof confirmTextFn === 'function') {
                                    confirmText = confirmTextFn.call(table);
                                } else {
                                    let name_td = row.find('td').eq(0)[0];
                                    confirmText = name_td.textContent;
                                }
                                td.setAttribute('data-confirm', confirmText);
                            }
                        });

                        table.datatable.rows({page: 'current'}).every(function (index, element) {
                            let row = $(this.node());
                            let td = row.find('td').eq(noOfCols - 1)[0];
                            table.loadGroup(showRecordBtn, td, table.context);
                            if (state.summary.enableDelete) {
                                td = row.find('td').eq(noOfCols)[0];
                                table.loadGroup(deleteBtn, td, table.context);
                            }
                        });

                        table.datatable.on('draw', function () {
                            table.datatable.rows({page: 'current'}).every(function (index, element) {
                                let row = $(this.node());
                                let td = row.find('td').eq(2)[0];
                                let btn = td.querySelector('adminui-button');
                                if (btn) {
                                    td.removeChild(btn);
                                }
                                table.loadGroup(showRecordBtn, td, table.context);
                                if (state.summary.enableDelete) {
                                    td = row.find('td').eq(3)[0];
                                    btn = td.querySelector('adminui-button');
                                    if (btn) {
                                        td.removeChild(btn);
                                    }
                                    table.loadGroup(deleteBtn, td, table.context);
                                }
                            });
                        });
                    }
                });
            }
        },

        'adminui-button': {

            confirmDelete: function () {
                let _this = this;
                this.rootElement.setAttribute('data-toggle', 'modal');
                let modalRoot = this.getComponentByName('adminui-modal-root', 'confirm-delete-' + state.name);
                if (modalRoot) {
                    this.rootElement.setAttribute('data-target', '#' + modalRoot.rootElement.id);
                }
                let fn = function () {
                    let card = _this.getComponentByName('adminui-content-card', state.name + '-details-card');
                    card.hide();
                    card.classList.add('d-none');

                    let id = _this.parentNode.id.split('delete-')[1];
                    let display = _this.parentNode.getAttribute('data-confirm');
                    let header = modalRoot.querySelector('adminui-modal-header');
                    header.setState({
                        title: state.assemblyName + ': Deleting ' + display
                    });
                    let button = _this.getComponentByName('adminui-button', 'deleteRecord-' + state.name);
                    button.recordId = id;
                }
                this.addHandler(fn);
            },

            delete: function () {
                let _this = this;
                let fn = async function () {
                    let id = _this.parentNode.id.split('delete-')[1];
                    /*
                    QEWD.send({
                      type: state.summary.qewd.delete,
                      params: {
                        id: _this.recordId
                      }
                    }, function(responseObj) {
                    */
                    let responseObj = await QEWD.reply({
                        type: state.summary.qewd.delete,
                        params: {
                            id: _this.recordId
                        }
                    });
                    let modalRoot = _this.getParentComponent('adminui-modal-root');
                    modalRoot.hide();
                    if (responseObj.message.error) {
                        toastr.error(responseObj.message.error);
                    } else {
                        toastr.info('Record deleted');
                        let table = _this.getComponentByName('adminui-datatables', state.name);
                        let target = table.getParentComponent('adminui-content-card-body').querySelector('.card-body');
                        ;
                        table.datatable.destroy();
                        table.remove();
                        let assembly = {
                            componentName: 'adminui-datatables',
                            assemblyName: state.assemblyName,
                            state: {
                                name: state.name
                            },
                            hooks: ['retrieveRecordSummary']
                        };
                        _this.loadGroup(assembly, target, _this.context);
                    }
                    //});
                };
                this.addHandler(fn);
            },

            save: function () {
                let _this = this;
                let fn = async function () {
                    let form = _this.getComponentByName('adminui-form', state.name);
                    let field;
                    let value;
                    let params = {
                        id: form.recordId
                    };
                    if (_this.context.selectedPatient
                        && state.patientIdDepends) {
                        params.patient_id = _this.context.selectedPatient.id;
                    }

                    for (let name in form.field) {
                        let value = form.fieldValues[name];
                        if (typeof value === 'object') {
                            let arr = [];
                            for (let xname in value) {
                                if (value[xname]) arr.push(xname);
                            }
                            params[formFieldPropertyNames[name]] = arr;
                        } else {
                            params[formFieldPropertyNames[name]] = value;
                        }
                    }
                    /*
                    QEWD.send({
                      type: state.update.qewd.save,
                      params: params
                    }, function(responseObj) {
                    */
                    let responseObj = await QEWD.reply({
                        type: state.update.qewd.save,
                        params: params
                    });
                    if (responseObj.message.error) {
                        toastr.error(responseObj.message.error);
                    } else {
                        toastr.info('Record updated successfully');
                        let table = _this.getComponentByName('adminui-datatables', state.name);
                        let target = table.getParentComponent('adminui-content-card-body').querySelector('.card-body');
                        ;
                        if (table) {
                            table.datatable.destroy();
                            table.remove();
                        }
                        let assembly = {
                            componentName: 'adminui-datatables',
                            assemblyName: state.assemblyName,
                            state: {
                                name: state.name
                            },
                            hooks: ['retrieveRecordSummary']
                        };
                        _this.loadGroup(assembly, target, _this.context);

                        let chartComponent = _this.getComponentByName('adminui-chart','unnamed-chart-0');
                        chartConfigGenerator(_this.context).then((config)=>{
                            chartComponent.chart.options = config.options;
                            chartComponent.chart.data = config.data;
                            chartComponent.chart.update();
                        });
                        let card = _this.getComponentByName('adminui-content-card', state.name + '-details-card');
                        card.hide();
                        card.classList.add('d-none');

                    }
                    //});
                };
                this.addHandler(fn);
            },

            getDetail: function () {
                let _this = this;
                let id = this.parentNode.id.split('record-')[1];
                this.addHandler(getDetailsActions.bind(this,id,this), this.rootElement);
            },

            showChart: function () {
                let _this = this;
                let context = this.context;

                $(this.rootElement).click(function () {
                    let chartBlock = _this.getComponentByName('adminui-content-card', state.name + '-chart-card');
                    let dataTable = _this.getComponentByName('adminui-content-card', state.name + '-summary-card');
                    console.log(dataTable);
                    chartBlock.classList.add('d-block');
                    chartBlock.classList.remove('d-none');

                    dataTable.classList.add('d-none');
                    dataTable.classList.remove('d-block');
                });
            },

            createNewRecord: function () {
                let _this = this;
                let fn = function () {
                    let card = _this.getComponentByName('adminui-content-card', state.name + '-details-card');
                    let title = card.querySelector('adminui-content-card-button-title');
                    title.setState({title: state.detail.newRecordTitle || 'New Record'});
                    title.hideButton();
                    let form = _this.getComponentByName('adminui-form', state.name);
                    form.recordId = 'new-record';
                    card.show();
                    card.classList.remove('d-none');

                    card.footer.show();
                    let field;
                    for (let name in form.field) {
                        field = form.field[name];
                        if (field.type === 'radio-group') {
                            field.setState({
                                selectedValue: '',
                                readonly: false
                            });
                        }
                        if (field.type === 'checkbox-group') {
                            field.setState({
                                selectedValues: [],
                                readonly: false
                            });
                        } else {
                            field.setState({
                                value: '',
                                readonly: false
                            });
                        }
                    }
                };
                this.addHandler(fn, this.button);
            },

            showVitals: function () {
                let _this = this;
                console.log('there4');
                let fn = function () {
                    console.log('there5');

                    let chart = _this.getComponentByName('adminui-content-card', state.name + '-chart-card');
                    let summary = _this.getComponentByName('adminui-content-card', state.name + '-summary-card');

                    chart.classList.remove('d-block');
                    chart.classList.add('d-none');

                    summary.classList.add('d-block');
                    summary.classList.remove('d-none');

                }
                this.addHandler(fn);
            },

            fullScreen: function () {
                let _this = this;

                let fn = function() {

                    let card = _this.getComponentByName(
                        'adminui-content-card',
                        state.name + '-details-card'
                    );
                    card.hide();
                    card.classList.add('d-none');

                    card.footer.hide();

                    _this.setState({
                        hideButton: true,
                    })
                }
                this.addHandler(fn, this.button);

            }
        },

        'adminui-content-card-button-title': {

            updateRecord: function () {
                let _this = this;
                let fn = function () {
                    let card = _this.getParentComponent('adminui-content-card');
                    let title = card.querySelector('adminui-content-card-button-title');
                    title.hideButton();
                    let form = _this.getComponentByName('adminui-form', state.name);
                    card.footer.show();
                    let field;
                    for (let name in form.field) {
                        field = form.field[name];
                        field.setState({readonly: false});
                    }
                };
                this.addHandler(fn, this.button);
            },

       },

        'adminui-content-card': {
            chartBlockHook: function () {
                this.classList.add('adminui-crud-chart-block');
            },

            summaryHook: function () {
                console.log(this);
                this.classList.add('adminui-crud-summary-block');
            },
            detailsHook: function () {
                this.classList.add('d-none');

                this.classList.add('adminui-crud-details-block');
            }
        },
        'adminui-chart': {
            getChartData: function () {
                let context = this.context;
                console.log('charts init');
                this.canvas.height = '500px';
                console.log(this.name);
                chartConfigGenerator(context).then((config)=> {
                    this.draw(config);
                    this.canvas.onclick = (evt) => {
                        let chart = this.chart;
                        var activePoints = chart.getElementsAtEvent(evt);
                        var activeDataSet = chart.getDatasetAtEvent(evt);

                        if (activePoints.length > 0) {
                            var clickedDatasetIndex = activeDataSet[0]._datasetIndex;
                            var clickedElementIndex = activePoints[0]._index;
                            var value = this.chart.data.datasets[clickedDatasetIndex].data[clickedElementIndex];
                            if (value) {
                                getDetailsActions.call(this, value.x, this);
                            }
                        }
                        console.log(value);
                    };
                    let card = this.getComponentByName('adminui-content-card', state.name + '-chart-card');
                    card.classList.add('d-none');
                });
            }
        },
    };


    return {component, hooks};

}
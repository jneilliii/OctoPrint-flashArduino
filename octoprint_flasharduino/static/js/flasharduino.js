$(function() {
    function FlashArduinoViewModel(parameters) {
        var self = this;

        self.settingsViewModel = parameters[0];
        self.loginState = parameters[1];
        self.connection = parameters[2];

        // Variables that will be passed to avrdude
        self.hex_path = ko.observable(undefined);
        self.selected_port = ko.observable(undefined);
        self.selected_board = ko.observableArray();

        self.flash_enable = ko.observable(false);

        self.flash_button = $("#settings-flash-arduino-start");
        self.upload_hex = $("#settings-flash-arduino");

        self.upload_hex.fileupload({
            dataType: "json",
            maxNumberOfFiles: 1,
            autoUpload: false,
            add: function(e, data) {
                if (data.files.length == 0) {
                    return false;
                }
                self.hex_path(data.files[0].name);
                self.flash_enable(true);
                self.flash_button.unbind("click");
                self.flash_button.on("click", function() {
                    var flash_data = {
                        board: "m2560",
                        programmer: "wiring",
                        port: "/dev/cu.usbserial-A6043R0F", ///dev/ttyUSB0
                        baudrate: "115200"
                    }; 
                    data.formData = flash_data;
                    data.submit();
                });
            },
            done: function(e, data) {
                return;
            }
        });

        self._displayNotification = function(response) {
            if (response == "success") {
                $.notify({
                    title: "Flashing firmware success!",
                    text: _.sprintf(gettext('Flashed "%(filename)s" with success'), {filename: self.hex_path()})},
                    "success"
                );
            } else {
                $.notify({
                    title: "Flashing firmware error!",
                    text: _.sprintf(gettext('An error occured while flashing "%(filename)s". Please check logs.'), {filename: self.hex_path()})},
                    "error"
                );
            }
        };

        self.bar_progress = function(bar_type, progress) {
            if(progress == "reset"){
                var bar_types = ["flash_read", "flash_write", "flash_verify", "flash_done"];
                _.each(bar_types, function(bar_type){
                    $("#"+bar_type+"_progress").removeClass();
                    $("#"+bar_type+"_progress").addClass("bg-none");
                });
            }

            if(progress == "busy"){
                $("#"+bar_type+"_progress").removeClass("bg-none");
                $("#"+bar_type+"_progress").addClass("bg-yellow");
                $("#"+bar_type+"_progress").parent().addClass("progress-striped progress-animate");

            }
            if(progress == "done"){
                $("#"+bar_type+"_progress").parent().removeClass("progress-striped progress-animate");
                $("#"+bar_type+"_progress").removeClass("bg-yellow");
                $("#"+bar_type+"_progress").addClass("bg-green");
            }

        };

        self.onDataUpdaterPluginMessage = function(plugin, data) {
            if (plugin != "flasharduino") {
                return;
            }

            if (!data.hasOwnProperty("type")) {
                return;
            }

            var messageType = data.type;

            if (messageType == "progress") {
                var progress = data.progress;
                var bar_type = data.bar_type;

                self.bar_progress(bar_type, progress);


            } else if (messageType == "result") {
                var result = data.result
                self._displayNotification(result);
                self.flash_enable(false);
            }

        };

        self.onBeforeBinding = function () {
            self.settings = self.settingsViewModel.settings;
        };

     }
    // This is how our plugin registers itself with the application, by adding some configuration
    // information to the global variable ADDITIONAL_VIEWMODELS
    ADDITIONAL_VIEWMODELS.push([
        // This is the constructor to call for instantiating the plugin
        FlashArduinoViewModel,

        // This is a list of dependencies to inject into the plugin, the order which you request
        // here is the order in which the dependencies will be injected into your view model upon
        // instantiation via the parameters argument
        ["settingsViewModel", "loginStateViewModel", "connectionViewModel"],

        // Finally, this is the list of all elements we want this view model to be bound to.
        ["#flash_arduino"]
    ]);
});

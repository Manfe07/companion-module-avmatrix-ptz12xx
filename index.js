var instance_skel = require('../../instance_skel')
var debug
var log

function instance(system, id, config) {
	var self = this

	// super-constructor
	instance_skel.apply(this, arguments)

    self.init_presets()
	self.actions() // export actions

	return self
}

instance.GetUpgradeScripts = function () {
	return [
		function v1_1_4(context, config, actions) {
			let updated = false

			return updated
		},
	]
}

instance.prototype.updateConfig = function (config) {
	var self = this

	self.setVariable('cam_id',self.config.cam_id)
	self.config = config

    self.init_presets()
	self.actions()
}

instance.prototype.init = function () {
	var self = this
	
	self.status(self.STATE_OK)

	self.setVariableDefinitions( [
		{
			label: 'Last Position',
			name: 'last_position'
		},
		{
			label: 'Camera ID',
			name: 'cam_id'
		},
	] );
	debug = self.debug
	log = self.log
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this
	return [
		{
			type: 'textinput',
			id: 'ip',
			label: 'Network IP-Adress',
			default: '0.0.0.0',
			width: 12,
		},
		{
			type: 'number',
			id: 'cam_id',
			label: 'Camera ID',
			min: 0,
			max: 255,
			default: 1,
		},
	]
}

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this
	debug('destroy')
}

instance.prototype.FIELD_PRESET = {
	type: 'number',
	label: 'Preset ID',
	id: 'preset_id',
	min: 0,
	max: 255,
	default: 0,
	required: true
}

instance.prototype.FIELD_FRAMRATE = {
	type: 'number',
	label: 'Framerate',
	id: 'framerate',
	min: 5,
	max: 60,
	default: 60,
	required: true
}


instance.prototype.FIELD_FOCOSMODE = {
	type: 'dropdown',
	label: 'Focus-Mode',
	id: 'focusmode',
	default: 2,
	choices: [
		{ id: 2, label: 'Auto'},
		{ id: 3, label: 'Manual'},
		{ id: 4, label: 'OnePush'},
	]
}

instance.prototype.FIELD_FOCOSZONE = {
	type: 'dropdown',
	label: 'Focus-Zone',
	id: 'focuszone',
	default: 3,
	choices: [
		{ id: 0, label: 'Top'},
		{ id: 1, label: 'Center'},
		{ id: 2, label: 'Bottom'},
		{ id: 3, label: 'All'},
	]
}

instance.prototype.FIELD_STARTSTOP = {
	type: 'dropdown',
	label: 'Start / Stop',
	id: 'startstop',
	choices: [
		{ id: 'Start', label: 'Start'},
		{ id: 'Stop', label: 'Stop'},
	]
}

instance.prototype.FIELD_MOVEMENT = {
	type: 'dropdown',
	label: 'Movement',
	id: 'movement',
	choices: [
		{ id: 'zoomIn', label: 'Zoom IN'},
		{ id: 'zoomOut', label: 'Zoom OUT'},
		{ id: 'up', label: 'Up'},
		{ id: 'down', label: 'Down'},
		{ id: 'left', label: 'Left'},
		{ id: 'right', label: 'Right'},
	]
}

instance.prototype.FIELD_FOCOSSENSITIVITY = {
	type: 'dropdown',
	label: 'Focus-Sensitivity',
	id: 'focussensitivity',
	default: 2,
	choices: [
		{ id: 1, label: 'High'},
		{ id: 2, label: 'Middle'},
		{ id: 3, label: 'Low'}
	]
}



instance.prototype.init_presets = function() {
    var self = this
    var presets = []
	for (let i = 1; i <= 8; i++) {
		presets.push({
				category: 'Position Presets',
				label: 'Pos ' + i,
				bank: {
					style: 'text',
					text: 'Cam\\n' + self.config.cam_id + '.' + i,
					size: 'auto',
					color: '16777215',
					bgcolor: self.rgb(0, 0, 0),
				},
				actions: [{
					action: 'call_preset',
					options: {
						preset_id: i,
					},
				}, ],
			}
		)

	}
    self.setPresetDefinitions(presets)
}

instance.prototype.actions = function (system) {
	var self = this

	self.setActions({
		call_preset: {
			label: 'Call Preset',
			options: [self.FIELD_PRESET]
		},
		set_preset: {
			label: 'Store Preset',
			options: [self.FIELD_PRESET]
		},
		move: {
			label: 'Move PTZ',
			options: [self.FIELD_MOVEMENT, self.FIELD_STARTSTOP]
		},
		set_focus: {
			label: 'Set Focus',
			options: [self.FIELD_FOCOSMODE, self.FIELD_FOCOSZONE, self.FIELD_FOCOSSENSITIVITY]
		},
		videosettings: {
			label: 'Video-Settings',
			options: [self.FIELD_FRAMRATE]
		}
	})
}

instance.prototype.action = function (action) {
	var self = this
	var cmd = ''
	var actionCmd = {
		call_preset: 'call_preset',
		set_preset:	'set_preset',
		set_focus: 'set_focus',
		videosettings: 'videosettings',
		move: 'move'
	}
	var actionCmd = actionCmd[action.action]
	
	self.setVariable('cam_id',self.config.cam_id)
	

	if (actionCmd === 'call_preset'){
		cmd = `{"SysCtrl":{"PtzCtrl":{"nChanel":0,"szPtzCmd":"preset_call","byValue":${action.options.preset_id}}}}`
		self.send_cmd(cmd)
		self.setVariable('last_position', action.options.preset_id);
	}
	if (actionCmd === 'set_preset'){
		cmd = `{"SysCtrl":{"PtzCtrl":{"nChanel":0,"szPtzCmd":"preset_set","byValue":${action.options.preset_id}}}}`
		self.send_cmd(cmd)
		self.setVariable('last_position', action.options.preset_id);
	}
	else if (actionCmd === 'set_focus'){
		cmd = `{"SetEnv":{"VideoParam": [{"stAF": {"emAFZone":${action.options.focuszone}},"nChannel":0}]}}`
		self.send_cmd(cmd)

		cmd = `{"SetEnv":{"VideoParam":[{"stAF": {"emAFMode":${action.options.focusmode}},"nChannel":0}]}}`
		self.send_cmd(cmd)

		cmd = `{"SetEnv":{"VideoParam": [{"stAF": {"nSensitivity":${action.options.focussensitivity}},"nChannel":0}]}}`
		self.send_cmd(cmd)
	}
	else if (actionCmd === 'move'){
		cmd = `{"SysCtrl":{"PtzCtrl":{"nChanel":0,"szPtzCmd":"${action.options.movement}_${action.options.starttop}","byValue":50}}}`
		self.send_cmd(cmd)
	}
	
}


instance.prototype.send_cmd = function(data){
	var self = this
	var header = {}

	var errorHandler = function (err, result) {
		if (err !== null) {
			//disabled e.message due to errors
			//self.log('error', `HTTP ${action.action.toUpperCase()} Request failed (${e.message})`)
			self.log('error', `HTTP ${action.action.toUpperCase()} Request failed (message)`)
			self.status(self.STATUS_ERROR, result.error.code)
		} else {
			self.status(self.STATUS_OK)
		}
	}
	url = `http://${self.config.ip}/ajaxcom?szCmd=` + data
	self.log('debug', url)
	self.system.emit(`rest_get`, url, errorHandler, header)
}




instance_skel.extendedBy(instance)
exports = module.exports = instance
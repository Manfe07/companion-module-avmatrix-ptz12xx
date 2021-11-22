var instance_skel = require('../../instance_skel')
var debug
var log

function instance(system, id, config) {
	var self = this

	// super-constructor
	instance_skel.apply(this, arguments)

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

	self.config = config

	self.actions()
}

instance.prototype.init = function () {
	var self = this
	
	self.status(self.STATE_OK)

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

instance.prototype.FIELD_CONTENTTYPE = {
	type: 'dropdown',
	label: 'Content Type',
	id: 'contenttype',
	default: 'application/json',
	choices: [
		{ id: 'application/json', label: 'application/json'},
		{ id: 'application/x-www-form-urlencoded', label: 'application/x-www-form-urlencoded'},
		{ id: 'application/xml', label: 'application/xml'},
		{ id: 'text/html', label: 'text/html'},
		{ id: 'text/plain', label: 'text/plain'}
	]
}

instance.prototype.actions = function (system) {
	var self = this

	self.setActions({
		call_preset: {
			label: 'Call Preset',
			options: [self.FIELD_PRESET],
		},
		set_preset: {
			label: 'Store Preset',
			options: [self.FIELD_PRESET],
		}
	})
}

instance.prototype.action = function (action) {
	var self = this
	var cmd = ''
	var actionCmd = {
		call_preset: 'call',
		set_preset:	'set'
	}
	var actionCmd = actionCmd[action.action]
	var errorHandler = function (err, result) {
		if (err !== null) {
			self.log('error', `HTTP ${action.action.toUpperCase()} Request failed (${e.message})`)
			self.status(self.STATUS_ERROR, result.error.code)
		} else {
			self.status(self.STATUS_OK)
		}
	}

	if (actionCmd === 'call'){
		self.log('debug', `call Preset ${action.options.preset_id} at ${self.config.ip}`)
		cmd = `http://${action.options.preset_id}:5000?id=${self.config.ip}`
		header = ``
		self.system.emit('rest', cmd, errorHandler, header)
	}
	

}

instance_skel.extendedBy(instance)
exports = module.exports = instance
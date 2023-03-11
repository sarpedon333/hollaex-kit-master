import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Spin, Tabs, Breadcrumb, Modal, message, Button } from 'antd';
import { LoadingOutlined, RightOutlined } from '@ant-design/icons';
import axios from 'axios';

import PluginList from './PluginList';
import PluginConfigure from './PluginConfigure';
import MyPlugins from './MyPlugins';
import {
	removePlugin,
	requestPlugins,
	requestMyPlugins,
	updatePlugins,
} from './action';
import { STATIC_ICONS } from 'config/icons';
import Spinner from './Spinner';
import AddThirdPartyPlugin from './AddPlugin';

import './index.css';

const TabPane = Tabs.TabPane;
const { Item } = Breadcrumb;

class Plugins extends Component {
	constructor(props) {
		super(props);
		const {
			router: {
				location: { query: { plugin } = {} },
			},
		} = this.props;
		this.state = {
			activeTab: '',
			loading: false,
			constants: {},
			showSelected: false,
			selectedPlugin: {},
			type: '',
			isConfigure: false,
			pluginData: [],
			myPlugins: [],
			plugin: {},
			isVisible: false,
			isRemovePlugin: false,
			removePluginName: '',
			tabKey: plugin ? 'my_plugin' : 'explore',
			pluginCards: [],
			processing: false,
			thirdPartyType: 'upload_json',
			thirdPartyError: '',
			thirdParty: {},
			step: 1,
			jsonURL: '',
		};
		this.removeTimeout = null;
	}

	componentDidMount() {
		this.getPluginsData();
	}

	componentDidUpdate(prevProps, prevState) {
		if (
			JSON.stringify(prevState.pluginData) !==
				JSON.stringify(this.state.pluginData) ||
			JSON.stringify(prevState.myPlugins) !==
				JSON.stringify(this.state.myPlugins) ||
			JSON.stringify(prevState.pluginCards) !==
				JSON.stringify(this.state.pluginCards)
		) {
			this.constructPluginsData();
		}
	}

	componentWillUnmount() {
		if (this.removeTimeout) {
			clearTimeout(this.removeTimeout);
		}
	}

	getPluginsData = async () => {
		try {
			await this.getPlugins();
			await this.getMyPlugins();
		} catch (err) {
			throw err;
		}
	};

	getMyPlugins = (params = {}) => {
		return requestMyPlugins(params)
			.then((res) => {
				if (res && res.data) {
					const {
						router,
						router: {
							location: { pathname, query: { plugin } = {} },
						},
					} = this.props;
					this.setState({ myPlugins: res.data }, () => {
						const pluginData = res.data.find(({ name }) => name === plugin);
						if (pluginData) {
							this.handleOpenPlugin(pluginData);
							this.handleBreadcrumb();
							router.push(pathname);
						}
					});
				}
			})
			.catch((err) => {
				throw err;
			});
	};

	getPlugins = (params = {}) => {
		// this.setState({ loading: true });
		return requestPlugins(params)
			.then((res) => {
				if (res && res.data) {
					let pluginCards = this.state.pluginCards;
					if (!params.search) {
						pluginCards = res.data.filter((val, key) => key <= 2);
					}
					this.setState({ loading: false, pluginData: res.data, pluginCards });
				}
			})
			.catch((err) => {
				this.setState({ loading: false });
				throw err;
			});
	};

	constructPluginsData = () => {
		const { pluginData, myPlugins, selectedPlugin, pluginCards } = this.state;
		let currentPlugin = selectedPlugin;
		const myPluginsName = myPlugins.map((plugin) => plugin.name);
		const constructedPluginData = pluginData.map((plugin) => {
			const pluginValue = {
				...plugin,
				enabled: myPluginsName.includes(plugin.name),
			};
			if (plugin.name === selectedPlugin.name) {
				currentPlugin = pluginValue;
			}
			return pluginValue;
		});
		const constructedCards = pluginCards.map((plugin) => ({
			...plugin,
			enabled: myPluginsName.includes(plugin.name),
		}));
		this.setState({
			pluginData: constructedPluginData,
			pluginCards: constructedCards,
			selectedPlugin: currentPlugin,
		});
	};

	removePlugin = (params = {}) => {
		this.setState({
			isRemovePlugin: true,
			showSelected: false,
			isConfigure: false,
			tabKey: 'my_plugin',
		});
		return removePlugin(params)
			.then((res) => {
				this.setState({
					isRemovePlugin: false,
					removePluginName: params.name,
				});
				this.removeTimeout = setTimeout(() => {
					const myPlugins = this.state.myPlugins.filter(
						(plugin) => plugin.name !== this.state.removePluginName
					);
					this.setState({ removePluginName: '', myPlugins });
				}, 2000);
			})
			.catch((err) => {
				this.setState({ isRemovePlugin: false });
				const _error =
					err.data && err.data.message ? err.data.message : err.message;
				message.error(_error);
			});
	};

	tabChange = (activeTab) => {
		this.setState({ activeTab });
	};

	onHandleCard = (key) => {
		if (key) {
			this.props.router.push(`/admin/plugins/${key}`);
		}
	};

	handleOpenPlugin = (plugin, plugin_type = '') => {
		const { pluginData, myPlugins, isConfigure } = this.state;
		if (plugin.version === 0) {
			this.setState({
				isVisible: true,
				showSelected: false,
				selectedPlugin: plugin,
			});
		} else if (
			pluginData.filter((value) => value.name === plugin.name).length ||
			myPlugins.filter((value) => value.name === plugin.name).length
		) {
			this.setState({
				showSelected: true,
				selectedPlugin: plugin,
			});
			if (plugin_type === 'add_plugin' && !isConfigure) {
				this.setState({
					type: 'configure',
					isConfigure: true,
				});
			}
		} else {
			this.setState({
				isVisible: true,
				selectedPlugin: plugin,
			});
		}
	};

	handleClose = () => {
		this.setState({
			showSelected: false,
			selectedPlugin: {},
			type: '',
			isConfigure: false,
			tabKey: 'explore',
		});
	};

	handleBreadcrumb = () => {
		this.setState({ isConfigure: true, type: 'configure' });
	};

	onCancelModal = () => {
		this.setState({ isVisible: false });
	};

	handlePluginList = (plugin) => {
		this.setState({
			myPlugins: [...this.state.myPlugins, plugin],
		});
	};

	handleUpdatePluginList = (plugin) => {
		let currentPlugin = this.state.selectedPlugin;
		const myPlugins = this.state.myPlugins.map((value) => {
			if (plugin.name === value.name) {
				currentPlugin = plugin;
				return plugin;
			}
			return value;
		});
		this.setState({
			myPlugins,
			selectedPlugin: currentPlugin,
		});
	};

	handleRestart = (callback) => {
		this.setProcessing();
		setTimeout(() => {
			this.getPluginsData()
				.then(() => {
					this.setProcessing(false, callback);
				})
				.catch(() => {
					this.handleRestart(callback);
				});
		}, 30000);
	};

	setProcessing = (processing = true, callback) => {
		this.setState({ processing }, () => {
			if (callback) {
				callback();
			}
		});
	};

	handleRedirect = () => {
		this.setState({ type: 'configure', isConfigure: true });
	};

	handleUpdatePlugin = () => {
		this.handleStep(3);
		const body = {
			...this.state.thirdParty,
		};
		updatePlugins({ name: body.name }, body)
			.then((res) => {
				if (res) {
					message.success('Third party plugin updated successfully');
					this.onCancelModal();
				}
			})
			.catch((err) => {
				const _error =
					err.data && err.data.message ? err.data.message : err.message;
				message.error(_error);
				this.onCancelModal();
			});
	};

	updateState = (thirdPartyError) => {
		this.setState({ thirdPartyError });
	};

	handleCancel = () => {
		this.setState({
			thirdParty: {},
			thirdPartyError: '',
			jsonURL: '',
		});
	};

	handleStep = (step) => {
		this.setState({ step, isVisible: true });
	};

	handleURL = (e) => {
		this.setState({ jsonURL: e.target.value });
	};

	handleChange = (e) => {
		if (e.target.value === 'upload_json') {
			this.setState({ thirdPartyType: 'upload_json' });
		} else {
			this.setState({ thirdPartyType: 'input_url' });
		}
		this.setState({ thirdPartyError: '', jsonURL: '' });
	};

	getJsonFromFile = async (file) => {
		return await new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (function () {
				return function (e) {
					try {
						let json = JSON.parse(e.target.result);
						resolve(json);
					} catch (err) {
						message.error(err.toString());
						reject('Invalid format');
					}
				};
			})(file);
			reader.readAsText(file);
		});
	};

	checkJSON = (json) => {
		if (json && json.name && json.version && json.author) {
			return true;
		} else {
			return false;
		}
	};

	handleFileChange = async (event) => {
		const file = event.target.files[0];
		if (file) {
			try {
				const res = await this.getJsonFromFile(file);
				const check = this.checkJSON(res);
				if (check) {
					this.setState({ thirdParty: res, thirdPartyError: '' });
				} else {
					this.setState({
						thirdPartyError:
							'The file format is not correct. Please make sure it follows JSON standard',
					});
				}
			} catch (err) {
				this.setState({
					thirdPartyError:
						'The file format is not correct. Please make sure it follows JSON standard',
				});
			}
		}
	};

	getJSONFromURL = async () => {
		try {
			if (this.state.jsonURL) {
				const res = await axios.get(this.state.jsonURL);
				if (res.data) {
					const check = this.checkJSON(res.data);
					if (check) {
						this.setState({ thirdParty: res.data, thirdPartyError: '' });
						this.handleStep(3);
					} else {
						this.setState({
							thirdPartyError:
								'The file format is not correct. Please make sure it follows JSON standard',
						});
					}
				}
			} else {
				this.setState({ thirdPartyError: 'Enter valid JSON file URL' });
			}
		} catch (err) {
			this.setState({
				thirdPartyError:
					'The file format is not correct. Please make sure it follows JSON standard',
			});
		}
	};

	handleBack = () => {
		this.handleSetBack();
		this.handleStep(1);
	};

	handleSetBack = () => {
		this.setState({ thirdParty: {}, thirdPartyError: '' });
	};

	renderModalContent = () => {
		const {
			selectedPlugin,
			thirdPartyType,
			thirdPartyError,
			step,
			thirdParty,
		} = this.state;
		switch (step) {
			case 1:
				return (
					<div className="admin-plugin-modal-wrapper">
						<div className="d-flex">
							<img
								src={STATIC_ICONS.MANUAL_PLUGIN_UPGRADE}
								alt="manual-plugin-upgrade"
								className="pr-3"
							/>
							<div>Upgrade third-party plugin</div>
						</div>
						<div className="d-flex align-items-center mt-4">
							<div>
								{selectedPlugin.icon ? (
									<img
										src={selectedPlugin.icon}
										className="plugin-icon"
										alt="plugin-icon"
									/>
								) : (
									<img
										src={STATIC_ICONS.DEFAULT_PLUGIN_THUMBNAIL}
										className="plugin-icon"
										alt="plugin-icon"
									/>
								)}
							</div>
							<div className="ml-4">
								<div>Name: {selectedPlugin.name}</div>
								<div>Current version: 1</div>
							</div>
						</div>
						<div className="w-85 mt-4">
							You can upgrade this plugin to a newer version manually by
							uploading a .json file while maintaining the current plugin's
							configuration values.
						</div>
						<div className="mt-4">
							Would you like to proceed with the upgrade?
						</div>
						<div className="my-4 btn-wrapper d-flex justify-content-between mt-5">
							<Button
								type={'primary'}
								size="large"
								className={'add-btn w-48'}
								onClick={this.onCancelModal}
							>
								Back
							</Button>
							<Button
								type={'primary'}
								size="large"
								className={'add-btn w-48'}
								onClick={() => this.handleStep(2)}
							>
								Proceed
							</Button>
						</div>
					</div>
				);
			case 2:
				return (
					<AddThirdPartyPlugin
						thirdPartyType={thirdPartyType}
						thirdPartyError={thirdPartyError}
						thirdParty={thirdParty}
						handleChange={this.handleChange}
						handleFileChange={this.handleFileChange}
						handleURL={this.handleURL}
						handleBack={this.handleBack}
						getJSONFromURL={this.getJSONFromURL}
						updateState={this.updateState}
						handleStep={this.handleStep}
						handlePlugin={this.handleUpdatePlugin}
					/>
				);
			case 3:
				return (
					<div className="p-2 modal-wrapper">
						<div className="">
							<div className="d-flex Spinner-wrapper">
								<div className="spinner-container">
									<Spin
										indicator={
											<LoadingOutlined style={{ fontSize: 24 }} spin />
										}
									/>
								</div>
								<div>Upgrading plugin</div>
							</div>
							<div className="ml-5 mt-5">
								<div>Please wait while the upgrade is being applied...</div>
							</div>
						</div>
					</div>
				);
			default:
				return (
					<div className="p-2 modal-wrapper">
						<div className="d-flex align-items-center">
							<div>
								{selectedPlugin.icon ? (
									<img
										src={selectedPlugin.icon}
										className="plugin-icon"
										alt="plugin-icon"
									/>
								) : (
									<img
										src={STATIC_ICONS.DEFAULT_PLUGIN_THUMBNAIL}
										className="plugin-icon"
										alt="plugin-icon"
									/>
								)}
							</div>
							<div className="ml-3">
								<h2>{selectedPlugin.name}</h2>
								<div>This plugin is coming soon!</div>
							</div>
						</div>
					</div>
				);
		}
	};

	render() {
		const {
			loading,
			constants,
			selectedPlugin,
			pluginData,
			isConfigure,
			showSelected,
			type,
			isVisible,
			myPlugins,
			tabKey,
			removePluginName,
			pluginCards,
			processing,
			thirdPartyType,
			thirdPartyError,
			thirdParty,
		} = this.state;
		if (loading || this.props.pluginsLoading) {
			return (
				<div className="app_container-content">
					<Spin size="large" />
				</div>
			);
		}

		return (
			<div className="admin-plugins-wrapper">
				{showSelected ? (
					<div className="plugins-wrapper">
						<Breadcrumb separator={<RightOutlined />}>
							<Item onClick={this.handleClose}>Explore</Item>
							<Item
								onClick={() =>
									this.setState({ type: 'pluginDetails', isConfigure: false })
								}
							>
								Plugin details
							</Item>
							{isConfigure ? (
								<Item onClick={() => this.setState({ type: 'configure' })}>
									Configure
								</Item>
							) : null}
						</Breadcrumb>
						<PluginConfigure
							handleBreadcrumb={this.handleBreadcrumb}
							type={type}
							selectedPlugin={selectedPlugin}
							handlePluginList={this.handlePluginList}
							updatePluginList={this.handleUpdatePluginList}
							removePlugin={this.removePlugin}
							restart={this.handleRestart}
							handleRedirect={this.handleRedirect}
							handleStep={this.handleStep}
						/>
					</div>
				) : (
					<div className="app_container-content admin-earnings-container admin-plugin-container">
						<Tabs defaultActiveKey={tabKey}>
							<TabPane tab="Explore" key="explore">
								<PluginList
									pluginData={pluginData}
									constants={constants}
									selectedPlugin={selectedPlugin}
									handleOpenPlugin={this.handleOpenPlugin}
									getPlugins={this.getPlugins}
									pluginCards={pluginCards}
								/>
							</TabPane>

							<TabPane tab="My plugins" key="my_plugin">
								<MyPlugins
									removePluginName={removePluginName}
									handleOpenPlugin={this.handleOpenPlugin}
									handlePluginList={this.handlePluginList}
									getPlugins={this.getPlugins}
									getMyPlugins={this.getMyPlugins}
									myPlugins={myPlugins}
									pluginData={pluginData}
									restart={this.handleRestart}
									thirdPartyType={thirdPartyType}
									thirdPartyError={thirdPartyError}
									thirdParty={thirdParty}
									handleStep={this.handleStep}
									handleURL={this.handleURL}
									handleChange={this.handleChange}
									handleFileChange={this.handleFileChange}
									handleBack={this.handleBack}
									handleSetBack={this.handleSetBack}
									handleCancel={this.handleCancel}
									getJSONFromURL={this.getJSONFromURL}
									updateState={this.updateState}
								/>
							</TabPane>
						</Tabs>
					</div>
				)}
				<Modal visible={isVisible} footer={null} onCancel={this.onCancelModal}>
					{this.renderModalContent()}
				</Modal>
				<Modal
					visible={processing}
					closable={false}
					centered={true}
					footer={null}
					maskClosable={false}
				>
					<div>
						<div>
							<h3 style={{ color: '#ffffff' }}>Plugins</h3>
						</div>
						<div className="d-flex align-items-center justify-content-center my-5 pt-3 pb-4">
							<Spinner />
						</div>
					</div>
				</Modal>
			</div>
		);
	}
}

const mapStateToProps = (state) => ({
	availablePlugins: state.app.availablePlugins,
	pluginsLoading: state.app.getPluginLoading,
});

export default connect(mapStateToProps)(Plugins);

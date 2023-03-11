import React, { Component } from 'react';
import { Link } from 'react-router';
import { Button, Input, Spin, Modal, message } from 'antd';
import _debounce from 'lodash/debounce';

import { STATIC_ICONS } from 'config/icons';
import { addPlugin, updatePlugins } from './action';
import AddThirdPartyPlugin from './AddPlugin';

class MyPlugins extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isVisible: false,
			step: 1,
			isConfirm: true,
			pluginData: {},
			buttonSubmitting: false,
		};
	}

	componentDidMount() {
		// this.props.getMyPlugins();
		// this.props.getPlugins();
	}

	searchPlugin = _debounce(this.props.getMyPlugins, 800);

	handleSearch = (e) => {
		let params = {};
		if (e.target.value) {
			params.search = e.target.value;
		}
		this.searchPlugin(params);
	};

	handlePlugin = () => {
		this.setState({ isVisible: true });
	};

	onCancel = () => {
		this.setState({
			isVisible: false,
			step: 1,
		});
		this.props.handleCancel();
	};

	handleInput = (e) => {
		if (e.target.value === 'I UNDERSTAND') {
			this.setState({ isConfirm: false });
		} else {
			this.setState({ isConfirm: true });
		}
	};

	handleNavigation = (res) => {
		message.success('Added third party plugin successfully');
		this.props.handleOpenPlugin(res, 'add_plugin');
	};

	handleAddPlugin = async () => {
		const { restart, myPlugins } = this.props;
		const body = {
			...this.props.thirdParty,
			enabled: true,
		};
		this.setState({ buttonSubmitting: true });
		const selectedPlugin = myPlugins.filter(
			(data) =>
				data.name === body.name &&
				data.author === body.author &&
				data.version !== body.version
		);
		const existPlugin = myPlugins.filter(
			(data) => data.name === body.name && data.author === body.author
		);
		if (existPlugin.length && !selectedPlugin.length) {
			message.warning('Plugin is already exist');
			this.setState({ buttonSubmitting: false });
		} else if (selectedPlugin.length) {
			updatePlugins({ name: body.name }, body)
				.then((res) => {
					this.onCancel();
					if (res) {
						restart(() =>
							message.success('Third party plugin updated successfully')
						);
						this.setState({ buttonSubmitting: false });
					}
				})
				.catch((err) => {
					this.onCancel();
					const _error =
						err.data && err.data.message ? err.data.message : err.message;
					message.error(_error);
					this.setState({ buttonSubmitting: false });
				});
		} else {
			addPlugin(body)
				.then((res) => {
					if (res) {
						this.onCancel();
						this.props.handlePluginList(res);
						restart(() => this.handleNavigation(res));
						this.setState({ buttonSubmitting: false });
					}
				})
				.catch((err) => {
					this.onCancel();
					const _error =
						err.data && err.data.message ? err.data.message : err.message;
					message.error(_error);
					this.setState({ buttonSubmitting: false });
				});
		}
	};

	handleStep = (step) => {
		this.setState({ step });
	};

	handleBack = () => {
		this.props.handleSetBack();
		this.handleStep(1);
	};

	renderPopup = () => {
		const { step, isConfirm, buttonSubmitting } = this.state;
		const {
			handleChange,
			handleFileChange,
			handleURL,
			thirdPartyType,
			thirdPartyError,
			getJSONFromURL,
			updateState,
			thirdParty,
		} = this.props;
		switch (step) {
			case 2:
				return (
					<AddThirdPartyPlugin
						thirdPartyType={thirdPartyType}
						thirdPartyError={thirdPartyError}
						thirdParty={thirdParty}
						handleChange={handleChange}
						handleFileChange={handleFileChange}
						handleURL={handleURL}
						handleBack={this.handleBack}
						getJSONFromURL={getJSONFromURL}
						updateState={updateState}
						handleStep={this.handleStep}
					/>
				);
			case 3:
				return (
					<div className="admin-plugin-modal-wrapper">
						<div className="confirm-plugin-wrapper">
							<h2>
								<b>Add third party plugin</b>
							</h2>
							<div>
								Please acknowledge that you understand the possible
								ramifications of adding an unverified plugin to your exchange.
							</div>
							<div className="mt-5">
								Type 'I UNDERSTAND' to confirm
								<Input className="mt-2" onChange={this.handleInput} />
							</div>

							<div className="my-4 btn-wrapper d-flex justify-content-between">
								<Button
									type="primary"
									className="add-btn"
									onClick={() => this.handleStep(2)}
								>
									Back
								</Button>
								<Button
									type="primary"
									className="remove-btn"
									onClick={this.handleAddPlugin}
									disabled={isConfirm || buttonSubmitting}
								>
									Add
								</Button>
							</div>
						</div>
					</div>
				);
			case 1:
			default:
				return (
					<div className="admin-plugin-modal-wrapper">
						<div className="remove-wrapper">
							<img
								src={STATIC_ICONS.ADD_THIRD_PARTY_PLUGIN}
								alt="Plugin"
								className="plugin-removal-icon"
							/>
							<h5>
								<b>Add third party plugin</b>
							</h5>
							<div>
								Adding a third party custom plugin is a good way to build extra
								features on your exchange but may have unknown effects on your
								exchange.
							</div>
							<div className="my-4 btn-wrapper d-flex justify-content-between">
								<Button
									type="primary"
									className="add-btn"
									onClick={this.onCancel}
								>
									Back
								</Button>
								<Button
									type="primary"
									className="add-btn"
									onClick={() => this.handleStep(2)}
								>
									I understand. Proceed.
								</Button>
							</div>
						</div>
					</div>
				);
		}
	};

	renderList = () => {
		const {
			myPlugins,
			removePluginName,
			handleOpenPlugin,
			pluginData,
		} = this.props;

		return myPlugins.map((item, index) => {
			const networkPlugin =
				pluginData.filter((data) => data.name === item.name)[0] || {};
			return (
				<div
					key={index}
					className={
						item.name === removePluginName
							? 'plugin-list-item removing-item d-flex align-items-center justify-content-between'
							: 'plugin-list-item d-flex align-items-center justify-content-between'
					}
					onClick={() => handleOpenPlugin(item)}
				>
					<div className="d-flex justify-content-center">
						<div>
							<img
								src={
									item.icon ? item.icon : STATIC_ICONS.DEFAULT_PLUGIN_THUMBNAIL
								}
								alt={`plugin-${index}`}
								className="plugin-list-icon"
							/>
						</div>
						<div>
							<div className="d-flex">
								<div className="plugin-list-title">{item.name}</div>
								{item.version ? (
									<div className="plugin-list-author plugin-author-align">
										v{item.version}
									</div>
								) : null}
							</div>
							<div className="plugin-list-author">{`By ${item.author}`}</div>
							<div className="plugin-list-bio">{item.bio}</div>
						</div>
					</div>
					<div className="d-flex justify-content-between align-items-start">
						<div className="add-btn">Configure</div>
						{networkPlugin.version > item.version ? (
							<div className="ml-2">
								<div className="update-btn">Update</div>
								<div className="d-flex">
									<div className="small-circle"></div>
									<div className="update-txt">{`v${networkPlugin.version} available`}</div>
								</div>
							</div>
						) : null}
					</div>
				</div>
			);
		});
	};

	render() {
		const { isLoading, isVisible } = this.state;
		if (isLoading) {
			return <Spin />;
		}

		return (
			<div className="myplugin-container">
				<div className="header">My exchange plugins</div>
				<div className="d-flex my-plugin-content">
					<div>
						This page displays all your plugins installed. You can also create
						your own plugin and install them here. To learn more about adding
						your own custom plugin visit the{' '}
						<Link to="/">plugin documentation page</Link>.
					</div>
					<div>
						<Button type="primary" onClick={this.handlePlugin}>
							ADD THIRD PARTY PLUGIN
						</Button>
					</div>
				</div>
				<div>
					<div className="plugin-header d-flex align-items-center justify-content-between">
						<div className="plugin-title">My installed plugins</div>
						<div className="search-plugin-input">
							<Input placeholder="Search..." onChange={this.handleSearch} />
						</div>
					</div>
					<div className="plugin-list">{this.renderList()}</div>
				</div>
				<Modal
					visible={isVisible}
					width={450}
					onCancel={this.onCancel}
					footer={false}
				>
					{this.renderPopup()}
				</Modal>
			</div>
		);
	}
}

export default MyPlugins;

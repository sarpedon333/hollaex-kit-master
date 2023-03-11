import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import classnames from 'classnames';
import { Link } from 'react-router';
import { isMobile } from 'react-device-detect';
import { DEFAULT_URL } from 'config/constants';
import MenuList from './MenuList';
import { MobileBarWrapper } from '../';
import { isLoggedIn } from '../../utils/token';
import { getTickers, changeTheme, setLanguage } from '../../actions/appActions';
import { updateUserSettings, setUserData } from '../../actions/userAction';
import ThemeSwitcher from './ThemeSwitcher';
import { EditWrapper, ButtonLink, Image } from 'components';
import withEdit from 'components/EditProvider/withEdit';
import withConfig from 'components/ConfigProvider/withConfig';
import AnnouncementList from './AnnouncementList';
import STRINGS from 'config/localizedStrings';
import LanguageSwitcher from './LanguageSwitcher';

class AppBar extends Component {
	state = {
		securityPending: 0,
		verificationPending: 0,
		walletPending: 0,
		selected: '',
	};

	componentDidMount() {
		if (this.props.user) {
			this.checkVerificationStatus(this.props.user, this.props.enabledPlugins);
			this.checkWalletStatus(this.props.user, this.props.coins);
		}
		this.props.getTickers();
		if (this.props.theme) {
			this.setSelectedTheme(this.props.theme);
		}
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		if (JSON.stringify(this.props.user) !== JSON.stringify(nextProps.user)) {
			this.checkVerificationStatus(nextProps.user, nextProps.enabledPlugins);
			this.checkWalletStatus(nextProps.user, nextProps.coins);
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.theme !== this.props.theme) {
			this.setSelectedTheme(this.props.theme);
		}
	}

	setSelectedTheme = (theme) => {
		const { themeOptions } = this.props;
		const selected = (
			themeOptions.find(({ value }) => value === theme) || themeOptions[0]
		).value;
		this.setState({ selected });
	};

	checkVerificationStatus = (user, enabledPlugins) => {
		let userData = user.userData || {};
		if (!Object.keys(userData).length && user.id) {
			userData = user;
		}
		const {
			phone_number,
			full_name,
			id_data = {},
			bank_account = [],
		} = userData;
		let securityPending = 0;
		let verificationPending = 0;
		if (user.id) {
			if (!user.otp_enabled) {
				securityPending += 1;
			}
			if (
				user.verification_level < 1 &&
				!full_name &&
				enabledPlugins.includes('kyc')
			) {
				verificationPending += 1;
			}
			if (
				(id_data.status === 0 || id_data.status === 2) &&
				enabledPlugins.includes('kyc')
			) {
				verificationPending += 1;
			}
			if (!phone_number && enabledPlugins.includes('sms')) {
				verificationPending += 1;
			}
			if (
				bank_account.filter((acc) => acc.status === 0 || acc.status === 2)
					.length === bank_account.length &&
				enabledPlugins.includes('bank')
			) {
				verificationPending += 1;
			}
			this.setState({ securityPending, verificationPending });
		}
	};

	checkWalletStatus = (user, coins) => {
		let walletPending = false;
		if (user.balance) {
			walletPending = true;
			Object.keys(coins).forEach((pair) => {
				if (user.balance[`${pair.toLowerCase()}_balance`] > 0) {
					walletPending = false;
				}
			});
		}
		this.setState({ walletPending: walletPending ? 1 : 0 });
	};

	handleTheme = (selected) => {
		const { isEditMode, themeOptions } = this.props;
		if (!isLoggedIn() || isEditMode) {
			this.props.changeTheme(selected);
			localStorage.setItem('theme', selected);
		} else {
			const { settings = { interface: {} } } = this.props.user;
			const settingsObj = { interface: { ...settings.interface } };
			const theme = (
				themeOptions.find(({ value }) => value === selected) || themeOptions[0]
			).value;
			settingsObj.interface.theme = theme;
			return updateUserSettings(settingsObj)
				.then(({ data }) => {
					this.props.setUserData(data);
					if (data.settings && data.settings.interface) {
						this.props.changeTheme(data.settings.interface.theme);
						localStorage.setItem('theme', data.settings.interface.theme);
					}
				})
				.catch((err) => {
					const error = { _error: err.message };
					if (err.response && err.response.data) {
						error._error = err.response.data.message;
					}
				});
		}
	};

	renderIcon = () => {
		const { icons: ICONS, isEditMode } = this.props;
		return (
			<div
				className={classnames(
					'app_bar-icon',
					'text-uppercase',
					'h-100',
					'ml-3'
				)}
			>
				<div className="d-flex h-100">
					<Link
						to={DEFAULT_URL}
						className={classnames({ 'disabled-link': isEditMode }, 'h-100')}
					>
						<Image
							iconId="EXCHANGE_LOGO"
							icon={ICONS['EXCHANGE_LOGO']}
							wrapperClassName="app_bar-icon-logo h-100"
						/>
					</Link>
					<EditWrapper iconId="EXCHANGE_LOGO" position={[-5, 5]} />
				</div>
			</div>
		);
	};

	goTo = (path) => () => {
		this.props.router.push(path);
	};

	onToggle = (theme) => {
		this.setSelectedTheme(theme);
		this.handleTheme(theme);
	};

	renderHomeIcon = () => {
		const { icons: ICONS } = this.props;
		return (
			<div className={classnames('app_bar-icon', 'text-uppercase', 'h-100')}>
				<div className="d-flex h-100">
					<div className="h-100">
						<Image
							iconId="EXCHANGE_LOGO"
							icon={ICONS['EXCHANGE_LOGO']}
							wrapperClassName="app_bar-icon-logo wide-logo h-100"
						/>
					</div>
					<EditWrapper iconId="EXCHANGE_LOGO" position={[-5, 5]} />
				</div>
			</div>
		);
	};

	renderButtonSection = () => {
		return (
			<div className="d-flex align-items-center buttons-section-header">
				<ButtonLink
					link={'/login'}
					type="button"
					label={STRINGS['LOGIN_TEXT']}
					className="main-section_button_invert home_header_button"
				/>
				<div style={{ width: '0.75rem' }} />
				<ButtonLink
					link={'/signup'}
					type="button"
					label={STRINGS['SIGNUP_TEXT']}
					className="main-section_button home_header_button"
				/>
			</div>
		);
	};

	renderAccountButton = () => {
		const { user } = this.props;
		return (
			<div className="pointer" onClick={this.goTo('/account')}>
				{user.email}
			</div>
		);
	};

	render() {
		const {
			user,
			constants = {},
			children,
			activePath,
			onMenuChange,
			menuItems,
			router,
			isHome,
		} = this.props;
		const { securityPending, verificationPending, walletPending } = this.state;

		const { selected } = this.state;
		const { themeOptions } = this.props;
		return isHome ? (
			<div className="home_app_bar d-flex justify-content-between align-items-center">
				<div className="d-flex align-items-center justify-content-center h-100 ml-2">
					{this.renderHomeIcon()}
				</div>
				<div className="mr-2">
					{isLoggedIn()
						? this.renderAccountButton()
						: this.renderButtonSection()}
				</div>
			</div>
		) : isMobile ? (
			<MobileBarWrapper
				className={classnames(
					'd-flex',
					'app_bar-mobile',
					'align-items-center',
					'justify-content-center'
				)}
			>
				<Link to="/">
					<div
						style={{
							backgroundImage: `url(${constants.logo_image})`,
						}}
						className="homeicon-svg"
					/>
				</Link>
			</MobileBarWrapper>
		) : (
			<div
				className={classnames('app_bar d-flex justify-content-between', {
					'no-borders': false,
				})}
			>
				<div
					id="home-nav-container"
					className="d-flex align-items-center justify-content-center h-100"
				>
					{this.renderIcon()}
				</div>
				{children}
				{!isLoggedIn() && (
					<div id="trade-nav-container">
						<ThemeSwitcher
							selected={selected}
							options={themeOptions}
							toggle={this.onToggle}
						/>
						<div
							className="login-container"
							onClick={() => router.push('/login')}
						>
							{STRINGS['LOGIN_TEXT'].toUpperCase()}
						</div>
					</div>
				)}
				{isLoggedIn() && (
					<div
						id="trade-nav-container"
						className="d-flex app-bar-account justify-content-end"
					>
						<div className="d-flex app_bar-quicktrade-container">
							<LanguageSwitcher
								selected={this.props.activeLanguage}
								valid_languages={this.props.constants.valid_languages}
								toggle={this.props.changeLanguage}
							/>
						</div>
						<div className="d-flex app_bar-quicktrade-container">
							<ThemeSwitcher
								selected={selected}
								options={themeOptions}
								toggle={this.onToggle}
							/>
						</div>
						<AnnouncementList user={user.email} />
						<MenuList
							menuItems={menuItems}
							securityPending={securityPending}
							verificationPending={verificationPending}
							walletPending={walletPending}
							user={user}
							activePath={activePath}
							onMenuChange={onMenuChange}
						/>
					</div>
				)}
			</div>
		);
	}
}

const mapStateToProps = (state) => {
	return {
		user: state.user,
		theme: state.app.theme,
		pair: state.app.pair,
		coins: state.app.coins,
		enabledPlugins: state.app.enabledPlugins,
		constants: state.app.constants,
		activeLanguage: state.app.language,
	};
};

const mapDispatchToProps = (dispatch) => ({
	getTickers: bindActionCreators(getTickers, dispatch),
	changeTheme: bindActionCreators(changeTheme, dispatch),
	setUserData: bindActionCreators(setUserData, dispatch),
	changeLanguage: bindActionCreators(setLanguage, dispatch),
});

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(withEdit(withConfig(AppBar)));

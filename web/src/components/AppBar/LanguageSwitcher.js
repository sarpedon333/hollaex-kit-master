import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { updateUserSettings } from 'actions/userAction';
import { Select } from 'antd';
import { generateLanguageFormValues } from 'containers/UserSettings/LanguageForm';
import React, { useEffect, useState } from 'react';
import { SubmissionError } from 'redux-form';
const { Option } = Select;

const LanguageSwitcher = ({ selected, valid_languages, toggle }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [_selected, setSelected] = useState(selected);
	const languageFormValue = generateLanguageFormValues(valid_languages).language
		.options;
	const onSwitch = (val) => {
		updateUserSettings({ language: val })
			.then(({ data }) => {
				if (data.settings) {
					if (data.settings.language) {
						toggle(data.settings.language);
					}
				}
			})
			.catch((err) => {
				const _error =
					err.response && err.response.data
						? err.response.data.message
						: err.message;
				throw new SubmissionError({ _error });
			});
	};

	useEffect(() => {
		if (setSelected && _selected !== selected) setSelected(selected);
	}, [setSelected, _selected, selected]);

	useEffect(() => {
		if (toggle) toggle(_selected);
	}, [_selected, toggle]);
	return (
		<Select
			value={_selected}
			size="small"
			onSelect={onSwitch}
			bordered={false}
			onClick={() => setIsOpen((prev) => !prev)}
			onBlur={() => {
				if (isOpen) setIsOpen(false);
			}}
			suffixIcon={isOpen ? <CaretUpOutlined /> : <CaretDownOutlined />}
			className="custom-select-input-style appbar elevated"
			dropdownClassName="custom-select-style select-option-wrapper"
		>
			{languageFormValue.map(({ value, icon, label }) => (
				<Option value={value} key={value} className="capitalize">
					<div className="language_option">
						<img
							width="10px"
							height="10px"
							src={icon}
							alt={label}
							className="mr-2"
						/>
						{label}
					</div>
				</Option>
			))}
		</Select>
	);
};

export default LanguageSwitcher;

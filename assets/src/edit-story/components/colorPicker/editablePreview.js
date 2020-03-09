/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { EditableInput } from 'react-color/lib/components/common';
import { useCallback, useRef, useLayoutEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import { useKeyDownEffect } from '../keyboard';

const Preview = styled.button`
  padding: 0;
  margin: 0;
  border: none;
  background: ${({ theme }) => theme.colors.bg.v7};
  color: ${({ theme }) => theme.colors.fg.v1};
`;

function EditablePreview({ value, width, format, onChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const enableEditing = useCallback(() => setIsEditing(true), []);
  const disableEditing = useCallback(() => setIsEditing(false), []);
  const wrapperRef = useRef(null);
  const editableRef = useRef();
  const inputStyles = {
    input: {
      fontFamily: 'monospace',
      width: `${width}px`,
      textAlign: 'center',
    },
  };

  // Handle ESC keypress to toggle input field.
  useKeyDownEffect(wrapperRef, { key: 'esc', editable: true }, disableEditing, [
    isEditing,
  ]);

  const handleOnBlur = (evt) => {
    if (!evt.currentTarget.contains(document.activeElement)) {
      disableEditing();
    }
  };

  useLayoutEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.input.focus();
      editableRef.current.input.select();
    }
  }, [isEditing]);

  if (!isEditing) {
    return <Preview onClick={enableEditing}>{format(value)}</Preview>;
  }

  return (
    <div ref={wrapperRef} tabIndex={-1} onBlur={handleOnBlur}>
      <EditableInput
        value={value}
        ref={editableRef}
        onChange={onChange}
        onChangeComplete={disableEditing}
        style={inputStyles}
      />
    </div>
  );
}

EditablePreview.propTypes = {
  value: PropTypes.string,
  width: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  format: PropTypes.func,
};

EditablePreview.defaultProps = {
  format: (val) => val,
};

export default EditablePreview;

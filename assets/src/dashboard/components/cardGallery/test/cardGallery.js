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
import { fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { renderWithTheme } from '../../../testUtils/';
import CardGallery from '../';

describe('CardGallery', () => {
  it('should render CardGallery', () => {
    const { getAllByTestId } = renderWithTheme(
      <CardGallery>
        <div data-testid={'test-child'}>{'Item 1'}</div>
        <div data-testid={'test-child'}>{'Item 2'}</div>
        <div data-testid={'test-child'}>{'Item 3'}</div>
        <div data-testid={'test-child'}>{'Item 4'}</div>
      </CardGallery>
    );

    // totalCards = childrenCount + activeCardCount (there is only 1 active card at a time)
    const totalCards = 5;
    expect(getAllByTestId('test-child')).toHaveLength(totalCards);
  });

  it('should set first child as active child', () => {
    const { getAllByTestId } = renderWithTheme(
      <CardGallery>
        <div data-testid={'active-child'}>{'Item 1'}</div>
        <div>{'Item 2'}</div>
        <div>{'Item 3'}</div>
        <div>{'Item 4'}</div>
      </CardGallery>
    );

    // The active child should always appear twice
    expect(getAllByTestId('active-child')).toHaveLength(2);
  });

  it('should change active child to the child that is clicked on', () => {
    const { getAllByTestId } = renderWithTheme(
      <CardGallery>
        <div>{'Item 1'}</div>
        <div>{'Item 2'}</div>
        <div data-testid={'test-child'}>{'Item 3'}</div>
        <div>{'Item 4'}</div>
      </CardGallery>
    );

    // When the child is not active, it should only appear once
    const testIds = getAllByTestId('test-child');
    expect(testIds).toHaveLength(1);

    // Simulate clicking on Item 3
    fireEvent.click(testIds[0]);

    // When active, it should appear twice
    expect(getAllByTestId('test-child')).toHaveLength(2);
  });
});

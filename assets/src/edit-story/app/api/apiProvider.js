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
import { useCallback } from 'react';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import addQueryArgs from '../../utils/addQueryArgs';
import { DATA_VERSION } from '../../migration';
import { useConfig } from '../';
import Context from './context';

export const MEDIA_PER_PAGE = 500;

function APIProvider({ children }) {
  const {
    api: { stories, media, fonts, link, users, statuses },
  } = useConfig();

  const getStoryById = useCallback(
    (storyId) => {
      const path = addQueryArgs(`${stories}/${storyId}`, { context: `edit` });
      return apiFetch({ path });
    },
    [stories]
  );

  const getStorySaveData = ({
    pages,
    featuredMedia,
    stylePresets,
    publisherLogo,
    autoAdvance,
    defaultPageDuration,
    ...rest
  }) => {
    return {
      story_data: {
        version: DATA_VERSION,
        pages,
        autoAdvance,
        defaultPageDuration,
      },
      featured_media: featuredMedia,
      style_presets: stylePresets,
      publisher_logo: publisherLogo,
      ...rest,
    };
  };

  const saveStoryById = useCallback(
    /**
     * Fire REST API call to save story.
     *
     * @param {import('../../types').Story} story Story object.
     * @return {Promise} Return apiFetch promise.
     */
    (story) => {
      const { storyId } = story;
      return apiFetch({
        path: `${stories}/${storyId}`,
        data: getStorySaveData(story),
        method: 'POST',
      });
    },
    [stories]
  );

  const autoSaveById = useCallback(
    /**
     * Fire REST API call to save story.
     *
     * @param {import('../../types').Story} story Story object.
     * @return {Promise} Return apiFetch promise.
     */
    (story) => {
      const { storyId } = story;
      return apiFetch({
        path: `${stories}/${storyId}/autosaves`,
        data: getStorySaveData(story),
        method: 'POST',
      });
    },
    [stories]
  );

  const deleteStoryById = useCallback(
    /**
     * Fire REST API call to delete story.
     *
     * @param {number}   storyId Story post id.
     * @return {Promise} Return apiFetch promise.
     */
    (storyId) => {
      return apiFetch({
        path: `${stories}/${storyId}`,
        method: 'DELETE',
      });
    },
    [stories]
  );

  const getMedia = useCallback(
    async ({ mediaType, searchTerm, pagingNum }) => {
      let apiPath = media;
      const perPage = MEDIA_PER_PAGE;

      if (mediaType) {
        apiPath = addQueryArgs(apiPath, { media_type: mediaType });
      }

      if (searchTerm) {
        apiPath = addQueryArgs(apiPath, { search: searchTerm });
      }

      // Temporary solution: fetching more than 100 items (100 is WP limit)
      const wpLimit = 100;
      const pagesCount =
        perPage <= wpLimit ? perPage : Math.ceil(perPage / wpLimit);
      const loopPerPage = perPage <= wpLimit ? perPage : wpLimit;

      const pagesPromises = Array(pagesCount)
        .fill(0)
        .map((_, i) => {
          const loopIter = i + 1;
          const page = (pagingNum - 1) * pagesCount + loopIter;

          apiPath = addQueryArgs(apiPath, {
            context: 'edit',
            per_page: loopPerPage,
            page,
          });

          return apiFetch({ path: apiPath, parse: false })
            .then(async (response) => {
              const jsonArray = await response.json();
              const headers = response.headers;
              const totalItems = parseInt(headers.get('X-WP-Total'));
              const newHeaders = new Headers();
              const totalPagesMod = Math.ceil(totalItems / perPage);
              newHeaders.set('X-WP-TotalPages', totalPagesMod);
              newHeaders.set('X-WP-Total', totalItems);
              return { data: jsonArray, headers: newHeaders };
            })
            .catch(() => null);
        });

      const dataArr = await Promise.all(pagesPromises);
      return dataArr.reduce(
        (acc, result) => {
          if (!result) {
            return acc;
          }
          const { data, headers } = result;
          return { data: [...acc.data, ...data], headers };
        },
        { data: [] }
      );
    },
    [media]
  );

  /**
   * Upload file to via REST API.
   *
   * @param {File}    file           Media File to Save.
   * @param {?Object} additionalData Additional data to include in the request.
   *
   * @return {Promise} Media Object Promise.
   */
  const uploadMedia = useCallback(
    (file, additionalData) => {
      // Create upload payload
      const data = new window.FormData();
      data.append('file', file, file.name || file.type.replace('/', '.'));
      Object.entries(additionalData).forEach(([key, value]) =>
        data.append(key, value)
      );

      // TODO: Intercept window.fetch here to support progressive upload indicator when uploading
      return apiFetch({
        path: media,
        body: data,
        method: 'POST',
      });
    },
    [media]
  );

  /**
   * Update Existing media.
   *
   * @param  {number} mediaId
   * @param  {Object} data Object of properties to update on attachment.
   * @return {Promise} Media Object Promise.
   */
  const updateMedia = useCallback(
    (mediaId, data) => {
      return apiFetch({
        path: `${media}/${mediaId}`,
        data,
        method: 'POST',
      });
    },
    [media]
  );

  /**
   * Gets metadata (title, favicon, etc.) from
   * a provided URL.
   *
   * @param  {number} url
   * @return {Promise} Result promise
   */
  const getLinkMetadata = useCallback(
    (url) => {
      const path = addQueryArgs(link, { url });
      return apiFetch({
        path,
      });
    },
    [link]
  );

  const getAllFonts = useCallback(() => {
    return apiFetch({ path: fonts }).then((data) =>
      data.map((font) => ({
        value: font.name,
        ...font,
      }))
    );
  }, [fonts]);

  const getAllStatuses = useCallback(() => {
    const path = addQueryArgs(statuses, { context: `edit` });
    return apiFetch({ path });
  }, [statuses]);

  const getAllUsers = useCallback(() => {
    return apiFetch({ path: addQueryArgs(users, { per_page: '-1' }) });
  }, [users]);

  const state = {
    actions: {
      autoSaveById,
      getStoryById,
      getMedia,
      getLinkMetadata,
      saveStoryById,
      deleteStoryById,
      getAllFonts,
      getAllStatuses,
      getAllUsers,
      uploadMedia,
      updateMedia,
    },
  };

  return <Context.Provider value={state}>{children}</Context.Provider>;
}

APIProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export default APIProvider;

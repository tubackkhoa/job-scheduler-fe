import i18n, { Callback } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { API_BASE_URL } from './api';
import storage from './storage';

class CustomBackend {
  type: 'backend' = 'backend';

  read(language: string, namespace: string, callback: Callback) {
    if (!namespace || language === 'en') return callback(null, null);
    const url =
      namespace === 'common'
        ? `/i18n/${language}.json`
        : `${API_BASE_URL}/assets/${namespace}/i18n/${language}.json`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // must return plain JSON
        callback(null, data);
      })
      .catch((err) => {
        callback(err, null);
      });
  }
}

i18n
  .use(new CustomBackend())
  .use(initReactI18next)
  .init({
    lng: storage.getLanguage() || 'en',
    fallbackLng: false,
    ns: ['common'],
  });

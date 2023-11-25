// Проверка поддержки и регистрация Service Worker
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/service-worker.js')
	  .then(registration => {
		console.log('Service Worker зарегистрирован:', registration);
	  })
	  .catch(err => {
		console.error('Ошибка регистрации Service Worker:', err);
	  });
  }

  let latestArticleId = 0;

  // Загрузка новостей при загрузке страницы и каждые 10 секунд
  document.addEventListener('DOMContentLoaded', () => {
	loadData();
	setInterval(loadData, 10000);
  });

  // Запрос новостей с сервера или из кеша
  function loadData() {
	fetch('/api/news')
	  .then(response => {
		if (!response.ok) {
		  throw new Error('Ошибка сетевого запроса');
		}
		return response.json();
	  })
	  .then(data => {
		if (data.items.length > 0) {
		  updateNewsList(data.items);
		  checkForNewArticle(data.items);
		}
	  })
	  .catch(error => {
		console.error('Ошибка при получении новостей:', error);
		loadFromCache();
	  });
  }

  // Обновление списка новостей на странице
  function updateNewsList(articles) {
	const newsContainer = document.getElementById('news-container');
	newsContainer.innerHTML = '';
	articles.forEach(article => {
	  const articleElem = document.createElement('div');
	  articleElem.className = 'news-article';
	  articleElem.innerHTML = `<h3>${article.title}</h3><p>Опубликовано ${article.author} в ${article.publicationDate}</p>`;
	  newsContainer.appendChild(articleElem);
	});
  }

  // Проверка наличия новых статей
  function checkForNewArticle(articles) {
	if (articles[0].id > latestArticleId) {
	  latestArticleId = articles[0].id;
	  if (document.hidden) {
		showNotification(articles[0].title);
	  }
	}
  }

  // Отображение уведомлений
  function showNotification(title) {
	if (Notification.permission === "granted") {
	  new Notification("Новая статья!", {
		body: title,
		icon: '/icons/icon-192x192.png'
	  });
	} else if (Notification.permission !== "denied") {
	  Notification.requestPermission().then(permission => {
		if (permission === "granted") {
		  new Notification("Новая статья!", {
			body: title,
			icon: '/icons/icon-192x192.png'
		  });
		}
	  });
	}
  }

  // Загрузка новостей из кеша
  function loadFromCache() {
	if (!navigator.serviceWorker) {
	  console.log('Service Worker не поддерживается этим браузером.');
	  return;
	}

	navigator.serviceWorker.controller.postMessage({ type: 'get-cached-news' });

	navigator.serviceWorker.onmessage = event => {
	  if (event.data.type === 'cached-news' && event.data.articles) {
		updateNewsList(event.data.articles);
	  }
	};
  }

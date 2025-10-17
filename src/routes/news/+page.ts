
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
  const res = await fetch('/api/news');
  const data = await res.json();
  return { articles: data.articles ?? [] };
};








//import type { PageLoad } from './$types';

//export const load: PageLoad = () => {
	//return {
		//title: 'AI News'
	//};
//};

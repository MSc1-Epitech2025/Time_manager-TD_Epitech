en regardant le fichier \backend\src\main\java\com\example\time_manager\graphql\controller\TeamController.java (ne pas le modifier)
La gestion des routes sur le front est dans le fichier : \frontend\src\app\core\services\team.ts

La gestion lors de la connection en "admin" est bonne exepter lorsque l'on clique sur le titre d'une team, ça nous renvois bien sur la page frontend\src\app\pages\manager-dashboard\manager-dashboard.ts mais rien ne s'affiche sur celle-ci

Lorsque l'on est connecter en "manager" il faudrait utiliser la route 'myTeamMembers' plutot que la route 'allTeams' car celle-ci n'est autoriser qu'aux admin

Rend la page et les modals plus jolie, en gardant la meme chart graphique pour les couleurs
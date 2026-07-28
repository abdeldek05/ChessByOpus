"""Onglet Admin : journal des connexions, sessions actives, activité, santé.

Lecture seule sur les tables existantes (`missions`, `scenarios`) et sur celles
de l'authentification (`login_events`, `sessions`). Seule exception : la
révocation d'une session, qui écrit dans `sessions`.
"""

import React, { useState, useEffect } from 'react';
import { User, Team } from '../types';
import { getUserTeams, createTeam, joinTeam } from '../services/dataService';
import { Users, Plus, LogIn, Hash, Copy, Check, Crown, Loader2, X } from 'lucide-react';

interface TeamsProps {
  user: User;
}

export const Teams: React.FC<TeamsProps> = ({ user }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Form States
  const [newTeamName, setNewTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, [user.id]);

  const loadTeams = () => {
    const userTeams = getUserTeams(user.id);
    setTeams(userTeams);
    setIsLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createTeam(newTeamName, user);
      setNewTeamName('');
      setShowCreateModal(false);
      loadTeams();
    } catch (err) {
      setError('Failed to create team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await joinTeam(joinCode, user);
      setJoinCode('');
      setShowJoinModal(false);
      loadTeams();
    } catch (err: any) {
      setError(err.message || 'Failed to join team.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Teams</h1>
          <p className="text-slate-500">Collaborate with peers on projects</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowJoinModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            <LogIn size={18} />
            Join Team
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-500 transition-colors shadow-sm shadow-blue-200"
          >
            <Plus size={18} />
            Create Team
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-dashed">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No Teams Yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            You haven't joined any teams. Create a new team to start a project or join an existing one using an invite code.
          </p>
          <button 
             onClick={() => setShowCreateModal(true)}
             className="text-blue-600 font-medium hover:underline"
          >
            Create your first team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {team.members.find(m => m.userId === user.id)?.role === 'Leader' ? (
                      <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Crown size={10} /> LEADER
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        MEMBER
                      </span>
                    )}
                    <span className="text-xs text-slate-400">• {team.members.length} Members</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {team.name.charAt(0)}
                </div>
              </div>

              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Team Members</p>
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-3">
                      <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-slate-100" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {member.name} {member.userId === user.id && '(You)'}
                        </p>
                        <p className="text-[10px] text-slate-400">{member.role}</p>
                      </div>
                      {member.role === 'Leader' && <Crown size={14} className="text-yellow-500" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Hash size={16} />
                    <span className="text-xs font-medium">Invite Code</span>
                  </div>
                  <button 
                    onClick={() => handleCopyCode(team.code)}
                    className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 hover:border-blue-300 transition-colors"
                  >
                    <span className="font-mono text-blue-600 text-sm tracking-wider">{team.code}</span>
                    {copiedCode === team.code ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Create New Team</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Team Name</label>
                <input 
                  type="text" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Neural Ninjas"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                disabled={!newTeamName.trim() || isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Team'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Join Existing Team</h3>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleJoin}>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                   <span className="font-bold">!</span> {error}
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Invite Code</label>
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AB12CD"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono uppercase tracking-widest text-center text-lg"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-2 text-center">Ask your team leader for the 6-character code</p>
              </div>

              <button 
                type="submit" 
                disabled={!joinCode.trim() || isSubmitting}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Join Team'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
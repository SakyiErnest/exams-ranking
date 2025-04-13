'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  generateInvitationToken, 
  getOrganizationTokens, 
  revokeToken,
  InvitationToken 
} from '@/lib/tokenService';
import { formatDate } from '@/lib/utils';

const TokenManagement: React.FC = () => {
  const { user } = useAuth();
  const { organization } = useOrganization();
  
  const [tokens, setTokens] = useState<InvitationToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [role, setRole] = useState<'admin' | 'teacher' | 'department_head'>('teacher');
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  
  // Load tokens
  useEffect(() => {
    const loadTokens = async () => {
      if (!organization) return;
      
      try {
        setIsLoading(true);
        const organizationTokens = await getOrganizationTokens(organization.id);
        setTokens(organizationTokens);
      } catch (err) {
        console.error('Error loading tokens:', err);
        setError('Failed to load invitation tokens');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTokens();
  }, [organization]);
  
  // Generate token
  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !organization) {
      setError('You must be logged in and part of an organization to generate tokens');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);
      
      const newToken = await generateInvitationToken(
        organization.id,
        role,
        user.uid,
        email.trim() || undefined
      );
      
      setTokens(prev => [newToken, ...prev]);
      setSuccess('Invitation token generated successfully');
      setEmail('');
    } catch (err) {
      console.error('Error generating token:', err);
      setError('Failed to generate invitation token');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Revoke token
  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation token?')) {
      return;
    }
    
    try {
      await revokeToken(tokenId);
      setTokens(prev => prev.filter(token => token.id !== tokenId));
      setSuccess('Token revoked successfully');
    } catch (err) {
      console.error('Error revoking token:', err);
      setError('Failed to revoke token');
    }
  };
  
  // Copy token to clipboard
  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };
  
  // Generate registration link
  const getRegistrationLink = (token: string) => {
    return `${window.location.origin}/register?token=${token}`;
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Invitation Tokens</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      {showCopiedMessage && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">
          Copied to clipboard!
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Generate New Token</h3>
        <form onSubmit={handleGenerateToken} className="space-y-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'teacher' | 'department_head')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="teacher">Teacher</option>
              <option value="department_head">Department Head</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="teacher@example.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              If provided, this token will be associated with this email address
            </p>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Token'}
            </button>
          </div>
        </form>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3">Active Tokens</h3>
        
        {isLoading ? (
          <div className="text-center py-4">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500">Loading tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <p className="text-gray-500">No active invitation tokens</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-mono text-sm">{token.token}</span>
                        <button
                          onClick={() => copyToClipboard(token.token)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          title="Copy token"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-1">
                        <button
                          onClick={() => copyToClipboard(getRegistrationLink(token.token))}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Copy registration link
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {token.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{token.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(new Date(token.expiresAt.seconds * 1000))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        token.isUsed 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {token.isUsed ? 'Used' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!token.isUsed && (
                        <button
                          onClick={() => handleRevokeToken(token.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Revoke token"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenManagement;

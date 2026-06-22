pipeline {
    agent any

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                credentialsId: 'GITHUB_LOGIN',
                url: 'https://github.com/franklyniyala/fintrust-bank.git'
            }
        }

        stage('Unit Test') {
            steps {
                sh 'npm install'
                sh 'npm test'
            }
        }
    }

    post {
        success {
            echo '✅ Unit Tests Passed'
        }

        failure {
            echo '❌ Unit Tests Failed'
        }
    }
}